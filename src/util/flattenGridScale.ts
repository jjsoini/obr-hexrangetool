import { type GridScale } from "@owlbear-rodeo/sdk";

export function flattenGridScale(scale: GridScale, multiplier = 1): string {
  return `${(multiplier * scale.parsed.multiplier).toFixed(
    scale.parsed.digits
  )}${scale.parsed.unit}`;
}
