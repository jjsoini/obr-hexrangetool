import OBR, {
  buildEffect,
  buildLabel,
  buildShape,
  Math2,
  type InteractionManager,
  type Item,
  type Vector2,
  type Uniform,
  type Matrix,
} from "@owlbear-rodeo/sdk";
import rangeIcon from "../assets/range.svg";
import { canUpdateItem } from "./permission";
import ringSksl from "./ring.frag";
import { getPluginId } from "../util/getPluginId";
import { getMetadata } from "../util/getMetadata";
import { Color, getStoredTheme, Theme } from "../theme/themes";
import { RangeType, Ring, Range, defaultRanges } from "../ranges/ranges";
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
  // Offset the ring by half a grid unit to account for the center of the grid
  return ring.radius * dpi + dpi / 2;
}

function getLabelTextColor(color: Color, threshold: number) {
  // Luminance
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return brightness < threshold ? "white" : "black";
}

function getRing(
  center: Vector2,
  offset: Vector2,
  size: number,
  name: string,
  color: string,
  type: RangeType
) {
  return buildShape()
    .fillOpacity(0)
    .strokeWidth(2)
    .strokeOpacity(0.9)
    .strokeColor(color)
    .strokeDash([10, 10])
    .shapeType(type === "square" ? "RECTANGLE" : "CIRCLE")
    .position(Math2.subtract(center, offset))
    .width(size)
    .height(size)
    .name(name)
    .metadata({
      [getPluginId("offset")]: offset,
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

async function getShaders(
  center: Vector2,
  theme: Theme,
  range: Range
): Promise<Item[]> {
  const dpi = await OBR.scene.grid.getDpi();
  const uniforms: Uniform[] = [];

  /*
   * Data uniform layout (each mat3 contains 2 circles):
   * [r1, r2, 0]  [R1, G1, B1]  [R2, G2, B2]
   * Where: r = radius, R/G/B = color components (0.0-1.0)
   * The shader is hard coded with 5 mat3 uniforms, so it supports up to 10 rings
   */
  if (range.rings.length > 10) {
    console.warn(
      `Range ${range.type} has more than 10 rings, rings shaders need updating to support more rings`
    );
  }
  for (let dataIndex = 0; dataIndex < 5; dataIndex++) {
    const ring1Index = dataIndex * 2;
    const ring2Index = dataIndex * 2 + 1;
    const color1 = theme.colors[ring1Index % theme.colors.length];
    const color2 = theme.colors[ring2Index % theme.colors.length];
    const ring1 = range.rings[ring1Index];
    const ring2 = range.rings[ring2Index];
    const radius1 = ring1 ? getRadiusForRing(ring1, dpi) : 0;
    const radius2 = ring2 ? getRadiusForRing(ring2, dpi) : 0;
    const value: Matrix = [
      radius1,
      radius2,
      0,
      color1.r / 255,
      color1.g / 255,
      color1.b / 255,
      color2.r / 255,
      color2.g / 255,
      color2.b / 255,
    ];

    uniforms.push({
      name: `data${dataIndex + 1}`,
      value: value,
    });
  }

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

  const color = buildEffect()
    .sksl(ringSksl)
    .effectType("VIEWPORT")
    .position(center)
    .layer("POINTER")
    .zIndex(1)
    .blendMode("COLOR")
    .uniforms([
      ...uniforms,
      {
        name: "minFalloff",
        value: 0.1,
      },
      {
        name: "maxFalloff",
        value: 0.6,
      },
      {
        name: "type",
        value: range.type === "square" ? 1 : 0,
      },
    ])
    .build();

  return [darken, color];
}

async function getRings(
  center: Vector2,
  theme: Theme,
  range: Range
): Promise<Item[]> {
  const dpi = await OBR.scene.grid.getDpi();
  const gridScale = await OBR.scene.grid.getScale();
  const items = [];
  for (let i = 0; i < range.rings.length; i++) {
    const baseColor = theme.colors[i % theme.colors.length];
    const color = getColorString(baseColor);
    const textColor = getLabelTextColor(baseColor, 180);
    const ring = range.rings[i];
    const radius = getRadiusForRing(ring, dpi);
    let ringOffset = { x: 0, y: 0 };
    if (range.type === "square") {
      ringOffset = { x: radius, y: radius };
    }
    items.push(
      getRing(center, ringOffset, radius * 2, ring.name, color, range.type)
    );
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

export function createRangeTool() {
  OBR.tool.createMode({
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
      const initialPosition = tokenPosition || event.pointerPosition;
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
      const range = (sceneMetadata[getPluginId("range")] ??
        defaultRanges[0]) as Range;

      const theme = getStoredTheme();
      shaders = await getShaders(initialPosition, theme, range);
      await OBR.scene.local.addItems(shaders);

      const rangeItems = await getRings(initialPosition, theme, range);
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
        const update = rangeInteraction[0];
        update?.((items) => {
          for (const item of items) {
            const offset = getMetadata(item.metadata, getPluginId("offset"), {
              x: 0,
              y: 0,
            });
            item.position = Math2.subtract(event.pointerPosition, offset);
          }
        });
        if (shaders.length > 0) {
          OBR.scene.local.updateItems(shaders, (items) => {
            for (const item of items) {
              item.position = event.pointerPosition;
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
    shortcut: "O",
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
