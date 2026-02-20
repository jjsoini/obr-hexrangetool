import OBR, {
  buildEffect,
  buildLabel,
  buildShape,
  Math2,
  type InteractionManager,
  type Item,
  type Vector2,
} from "@owlbear-rodeo/sdk";
import rangeIcon from "../assets/range.svg";
import { canUpdateItem } from "./permission";
import { getPluginId } from "../util/getPluginId";
import { getMetadata } from "../util/getMetadata";
import { Ring, Range, defaultRanges } from "../ranges/ranges";

type Color = { r: number; g: number; b: number };
const RING_COLOR: Color = { r: 220, g: 38, b: 38 };
import { flattenGridScale } from "../util/flattenGridScale";

let rangeInteraction: InteractionManager<Item[]> | null = null;
let tokenInteraction: InteractionManager<Item> | null = null;
let shaders: Item[] = [];
let grabOffset: Vector2 = { x: 0, y: 0 };
let downTarget: Item | null = null;
let labelOffset = -16;

function getColorString(color: Color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function getRadiusForRing(ring: Ring, dpi: number) {
  // Floor to full grid cells, then offset by half a cell to account for the center
  return Math.floor(ring.radius) * dpi + dpi / 2;
}

function getLabelTextColor(color: Color, threshold: number) {
  // Luminance
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return brightness < threshold ? "white" : "black";
}

function getRing(
  center: Vector2,
  size: number,
  name: string,
  color: string,
  rotation: number
) {
  return buildShape()
    .fillOpacity(0)
    .strokeWidth(2)
    .strokeOpacity(0.9)
    .strokeColor(color)
    .strokeDash([10, 10])
    .shapeType("HEXAGON")
    .position(center)
    .width(size)
    .height(size)
    .rotation(rotation)
    .name(name)
    .metadata({
      [getPluginId("offset")]: { x: 0, y: 0 },
    })
    .disableHit(true)
    .layer("POPOVER")
    .build();
}

function getLabel(
  center: Vector2,
  offset: Vector2,
  text: string,
  backgroundColor: string,
  textColor: string
) {
  return buildLabel()
    .fillColor(textColor)
    .fillOpacity(1.0)
    .plainText(text)
    .position(Math2.subtract(center, offset))
    .pointerDirection("UP")
    .backgroundOpacity(0.8)
    .backgroundColor(backgroundColor)
    .padding(8)
    .cornerRadius(20)
    .pointerHeight(0)
    .metadata({
      [getPluginId("offset")]: offset,
    })
    .minViewScale(1)
    .disableHit(true)
    .layer("POPOVER")
    .build();
}

async function getShaders(): Promise<Item[]> {
  const darken = buildEffect()
    .sksl(
      `
half4 main(float2 coord) {
    return half4(0.85, 0.85, 0.85, 1.0);
}
      `
    )
    .effectType("VIEWPORT")
    .layer("POINTER")
    .zIndex(0)
    .blendMode("MULTIPLY")
    .build();

  return [darken];
}

async function getRings(
  center: Vector2,
  range: Range
): Promise<Item[]> {
  const dpi = await OBR.scene.grid.getDpi();
  const gridScale = await OBR.scene.grid.getScale();
  const gridType = await OBR.scene.grid.getType();
  // OBR's HEXAGON shape defaults to flat-top; rotate 30° for pointy-top grids
  const rotation = gridType === "HEX_VERTICAL" ? 30 : 0;
  const color = getColorString(RING_COLOR);
  const textColor = getLabelTextColor(RING_COLOR, 180);
  const items = [];
  for (let i = 0; i < range.rings.length; i++) {
    const ring = range.rings[i];
    const radius = getRadiusForRing(ring, dpi);
    items.push(getRing(center, radius * 2, ring.name, color, rotation));
    const labelItemOffset = { x: 0, y: radius + labelOffset };
    let labelText = "";
    if (!range.hideLabel) {
      labelText += ring.name;
    }
    if (!range.hideSize) {
      labelText += `${labelText ? " " : ""}${flattenGridScale(
        gridScale,
        ring.radius
      )}`;
    }
    if (labelText) {
      items.push(
        getLabel(center, labelItemOffset, labelText, color, textColor)
      );
    }
  }

  return items;
}

function cleanup() {
  if (rangeInteraction) {
    const cancel = rangeInteraction[1];
    cancel();
    rangeInteraction = null;
  }
  if (tokenInteraction) {
    const cancel = tokenInteraction[1];
    cancel();
    tokenInteraction = null;
  }
  if (shaders.length > 0) {
    OBR.scene.local.deleteItems(shaders.map((shader) => shader.id));
    shaders = [];
  }
  downTarget = null;
}

async function finalizeMove() {
  if (tokenInteraction) {
    const final = tokenInteraction[0](() => {});
    const withAttachments = await OBR.scene.items.getItemAttachments([
      final.id,
    ]);
    withAttachments.sort((a, b) => a.zIndex - b.zIndex);
    await OBR.scene.items.updateItems(withAttachments, (items) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id === final.id) {
          item.position = final.position;
        }
        if (!item.disableAutoZIndex) {
          item.zIndex = Date.now() + i;
        }
      }
    });
  }
}

export function registerRangeTool() {
  return OBR.tool.createMode({
    id: getPluginId("mode/range"),
    icons: [
      {
        icon: rangeIcon,
        label: "Range",
        filter: {
          activeTools: ["rodeo.owlbear.tool/measure"],
          permissions: ["RULER_CREATE"],
        },
      },
    ],
    onToolClick() {
      return false;
    },
    async onToolDown(_, event) {
      cleanup();

      const tokenPosition =
        event.target && !event.target.locked && event.target.position;
      const initialPosition = tokenPosition
        ? tokenPosition
        : await OBR.scene.grid.snapPosition(event.pointerPosition, 1, false, true);
      // Account for the grab offset so the token doesn't snap to the pointer
      if (tokenPosition) {
        grabOffset = Math2.subtract(event.pointerPosition, tokenPosition);
      } else {
        grabOffset = { x: 0, y: 0 };
      }

      // Check the token interaction first so the move event doesn't fire for the
      // range items while checking the permissions
      if (
        event.target &&
        !event.target.locked &&
        event.target.type === "IMAGE" &&
        (await canUpdateItem(event.target))
      ) {
        downTarget = event.target;
      }

      const sceneMetadata = await OBR.scene.getMetadata();
      const rawRange = (sceneMetadata[getPluginId("range")] ??
        defaultRanges[0]) as Range;

      // Deduplicate rings that floor to the same drawn radius
      const seenRadii = new Set<number>();
      const range: Range = {
        ...rawRange,
        rings: rawRange.rings.filter((ring) => {
          const r = Math.floor(ring.radius);
          if (seenRadii.has(r)) return false;
          seenRadii.add(r);
          return true;
        }),
      };

      shaders = await getShaders();
      await OBR.scene.local.addItems(shaders);

      const rangeItems = await getRings(initialPosition, range);
      rangeInteraction = await OBR.interaction.startItemInteraction(rangeItems);
    },
    async onToolDragStart() {
      if (downTarget) {
        tokenInteraction = await OBR.interaction.startItemInteraction(
          downTarget
        );
      }
    },
    async onToolDragMove(_, event) {
      // Check the down target first as that's the earliest indicator of a valid target
      if (downTarget) {
        if (tokenInteraction) {
          const update = tokenInteraction[0];
          const position = await OBR.scene.grid.snapPosition(
            Math2.subtract(event.pointerPosition, grabOffset)
          );
          update?.((token) => {
            token.position = position;
          });
        }
      } else if (rangeInteraction) {
        const center = await OBR.scene.grid.snapPosition(
          event.pointerPosition,
          1,
          false,
          true
        );
        const update = rangeInteraction[0];
        update?.((items) => {
          for (const item of items) {
            const offset = getMetadata(item.metadata, getPluginId("offset"), {
              x: 0,
              y: 0,
            });
            item.position = Math2.subtract(center, offset);
          }
        });
        if (shaders.length > 0) {
          OBR.scene.local.updateItems(shaders, (items) => {
            for (const item of items) {
              item.position = center;
            }
          });
        }
      }
    },
    onToolDragEnd() {
      finalizeMove();
      cleanup();
    },
    onToolDragCancel() {
      cleanup();
    },
    onDeactivate() {
      cleanup();
    },
    onToolUp() {
      finalizeMove();
      cleanup();
    },
    shortcut: "H",
    cursors: [
      {
        cursor: "grabbing",
        filter: {
          dragging: true,
          target: [
            {
              value: "IMAGE",
              key: "type",
            },
          ],
        },
      },
      {
        cursor: "grab",
        filter: {
          dragging: false,
          target: [
            {
              value: "IMAGE",
              key: "type",
            },
            {
              value: false,
              key: "locked",
            },
          ],
        },
      },
      {
        cursor: "crosshair",
      },
    ],
  });
}

export function unregisterRangeTool() {
  return OBR.tool.removeMode(getPluginId("mode/range"));
}
