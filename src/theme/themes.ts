export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Theme = {
  name: string;
  colors: Color[];
};

const base: Theme = {
  name: "Base",
  colors: [
    { r: 140, g: 75, b: 235 },
    { r: 25, g: 141, b: 230 },
    { r: 108, g: 191, b: 21 },
    { r: 222, g: 170, b: 25 },
    { r: 225, g: 105, b: 25 },
    { r: 225, g: 25, b: 142 },
  ],
};

const deuteranopia: Theme = {
  name: "Deuteranopia",
  colors: [
    { r: 138, g: 75, b: 235 },
    { r: 230, g: 137, b: 25 },
    { r: 21, g: 165, b: 191 },
    { r: 25, g: 222, b: 118 },
    { r: 180, g: 25, b: 225 },
    { r: 235, g: 187, b: 75 },
  ],
};

const tritanopia: Theme = {
  name: "Tritanopia",
  colors: [
    { r: 75, g: 205, b: 235 },
    { r: 184, g: 25, b: 230 },
    { r: 21, g: 114, b: 191 },
    { r: 222, g: 125, b: 25 },
    { r: 59, g: 225, b: 25 },
    { r: 235, g: 75, b: 84 },
  ],
};

const protanopia: Theme = {
  name: "Protanopia",
  colors: [
    { r: 140, g: 75, b: 235 },
    { r: 25, g: 230, b: 114 },
    { r: 21, g: 127, b: 191 },
    { r: 222, g: 222, b: 25 },
    { r: 225, g: 25, b: 217 },
    { r: 235, g: 156, b: 75 },
  ],
};

export const themes: Theme[] = [base, deuteranopia, tritanopia, protanopia];

export function getTheme(name: string): Theme | undefined {
  return themes.find((theme) => theme.name === name);
}

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (typeof stored === "string") {
      return getTheme(stored) ?? base;
    }
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
  }
  return base;
}
