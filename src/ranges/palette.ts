export type Color = { r: number; g: number; b: number };

export const RING_COLOR: Color = { r: 220, g: 38, b: 38 };

// Colorblind-safe colors from the Okabe-Ito palette, ordered so neighbouring
// rings contrast. Repeats for rings beyond the palette length.
export const RING_PALETTE: Color[] = [
  { r: 86, g: 180, b: 233 }, // Sky blue
  { r: 230, g: 159, b: 0 }, // Orange
  { r: 0, g: 158, b: 115 }, // Bluish green
  { r: 240, g: 228, b: 66 }, // Yellow
  { r: 204, g: 121, b: 167 }, // Reddish purple
];

export function getPaletteColor(index: number): Color {
  return RING_PALETTE[index % RING_PALETTE.length];
}

export function getColorString(color: Color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
