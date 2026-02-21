import OBR, {
  buildCurve,
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

function getCenterHexSize(dpi: number) {
  // OBR grid dpi is center-to-center spacing; HEXAGON width/height is corner-to-corner.
  // Convert one hex cell to corner-to-corner size.
  return (2 * dpi) / Math.sqrt(3);
}

function getLabelTextColor(color: Color, threshold: number) {
  // Luminance
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return brightness < threshold ? "white" : "black";
}

function getHexArea(
  center: Vector2,
  range: number,
  dpi: number,
  name: string,
  color: string,
  rotation: number
) {
  return buildCurve()
    .fillColor(color)
    .fillOpacity(0.10)
    .strokeWidth(2)
    .strokeOpacity(0.9)
    .strokeColor(color)
    .strokeDash([10, 10])
    .tension(0)
    .closed(true)
    .position(center)
    .name(name)
    .metadata({
      [getPluginId("offset")]: { x: 0, y: 0 },
    })
    .disableHit(true)
    .layer("POPOVER")
    .points(getHexAreaPoints(range, dpi, rotation))
    .build();
}

function getHexAreaPoints(
  range: number,
  hexDiameter: number,
  rotation: number
) {
  const apothem = hexDiameter / 2;
  const side = hexDiameter / Math.sqrt(3);
  const cornerRadius = side;
  const sin30 = 0.5;

  type Edge = { start: Vector2; end: Vector2 };
  const edges = new Map<string, Edge>();

  const rounded = Math.max(0, Math.floor(range));

  function pointKey(point: Vector2) {
    return `${point.x.toFixed(5)},${point.y.toFixed(5)}`;
  }

  function edgeKey(a: Vector2, b: Vector2) {
    const ak = pointKey(a);
    const bk = pointKey(b);
    return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
  }

  function rotatePoint(point: Vector2, degrees: number): Vector2 {
    const radians = (degrees * Math.PI) / 180;
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return {
      x: point.x * c - point.y * s,
      y: point.x * s + point.y * c,
    };
  }

  function getFlatTopHexCorners(center: Vector2): Vector2[] {
    return [
      { x: center.x + cornerRadius, y: center.y },
      { x: center.x + cornerRadius * sin30, y: center.y + apothem },
      { x: center.x - cornerRadius * sin30, y: center.y + apothem },
      { x: center.x - cornerRadius, y: center.y },
      { x: center.x - cornerRadius * sin30, y: center.y - apothem },
      { x: center.x + cornerRadius * sin30, y: center.y - apothem },
    ];
  }

  // Axial coordinates for flat-top hexes:
  // x = 1.5 * side * q
  // y = sqrt(3) * side * (r + q/2)
  for (let q = -rounded; q <= rounded; q++) {
    const rMin = Math.max(-rounded, -q - rounded);
    const rMax = Math.min(rounded, -q + rounded);
    for (let r = rMin; r <= rMax; r++) {
      const cellCenter = {
        x: 1.5 * side * q,
        y: side * Math.sqrt(3) * (r + q / 2),
      };
      const corners = getFlatTopHexCorners(cellCenter);
      for (let i = 0; i < corners.length; i++) {
        const start = corners[i];
        const end = corners[(i + 1) % corners.length];
        const key = edgeKey(start, end);
        if (edges.has(key)) {
          edges.delete(key);
        } else {
          edges.set(key, { start, end });
        }
      }
    }
  }

  const nextByStart = new Map<string, Edge>();
  for (const edge of edges.values()) {
    nextByStart.set(pointKey(edge.start), edge);
  }

  const edgeList = [...edges.values()];
  if (edgeList.length === 0) {
    return [];
  }
  const startEdge = edgeList.reduce((best, edge) => {
    if (!best) return edge;
    if (edge.start.y < best.start.y) return edge;
    if (edge.start.y === best.start.y && edge.start.x > best.start.x) return edge;
    return best;
  }, edgeList[0]);

  const ordered: Vector2[] = [];
  let current = startEdge;
  let guard = 0;
  while (current && guard < edges.size + 2) {
    ordered.push(current.start);
    const next = nextByStart.get(pointKey(current.end));
    if (!next || pointKey(next.start) === pointKey(startEdge.start)) {
      break;
    }
    current = next;
    guard++;
  }

  const rotated = ordered.map((point) => rotatePoint(point, rotation));

  // Ensure clockwise order for consistency.
  const twiceArea = rotated.reduce((sum, p, i) => {
    const next = rotated[(i + 1) % rotated.length];
    return sum + (p.x * next.y - next.x * p.y);
  }, 0);
  if (twiceArea < 0) {
    rotated.reverse();
  }

  return rotated;
}

function getRing(
  center: Vector2,
  size: number,
  name: string,
  color: string,
  rotation: number
) {
  return buildShape()
    .fillColor(color)
    .fillOpacity(0.10)
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
    .lineHeight(0.9)
    .fontSize(14)
    .position(Math2.subtract(center, offset))
    .pointerDirection("UP")
    .backgroundOpacity(0.8)
    .backgroundColor(backgroundColor)
    .padding(6)
    .cornerRadius(8)
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
  // Match scene grid orientation for all hex ranges.
  const defaultRotation = gridType === "HEX_VERTICAL" ? 30 : 0;
  const color = getColorString(RING_COLOR);
  const textColor = getLabelTextColor(RING_COLOR, 180);
  const items = [];
  for (let i = 0; i < range.rings.length; i++) {
    const ring = range.rings[i];
    const radius = getRadiusForRing(ring, dpi);
    const roundedRadius = Math.floor(ring.radius);
    const rotation = defaultRotation;
    const isHexGrid =
      gridType === "HEX_HORIZONTAL" || gridType === "HEX_VERTICAL";
    const size =
      isHexGrid && roundedRadius === 0 ? getCenterHexSize(dpi) : radius * 2;
    if (isHexGrid) {
      items.push(
        getHexArea(center, roundedRadius, dpi, ring.name, color, rotation)
      );
    } else {
      items.push(getRing(center, size, ring.name, color, rotation));
    }
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
        label: "Hex Range",
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
      const initialPosition = await OBR.scene.grid.snapPosition(
        event.pointerPosition,
        1,
        false,
        true
      );
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
