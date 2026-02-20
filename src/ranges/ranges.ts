import { isPlainObject } from "../util/isPlainObject";
import { dagger } from "./templates/dagger";
import { steel } from "./templates/steel";
import { dragons } from "./templates/dragons";

export type Ring = {
  radius: number;
  name: string;
  id: string;
};

export type RangeType = "circle" | "square";

export type Range = {
  name: string;
  id: string;
  type: RangeType;
  rings: Ring[];
  hideLabel?: boolean;
  hideSize?: boolean;
};

export const defaultRanges: Range[] = [dagger, steel, dragons];

function isRange(value: unknown): value is Range {
  return (
    isPlainObject(value) &&
    "name" in value &&
    "id" in value &&
    "type" in value &&
    "rings" in value
  );
}

export function getCustomRanges(): Range[] {
  try {
    const stored = localStorage.getItem("ranges");
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(isRange);
    }
  } catch (error) {
    console.warn("Failed to read custom ranges from localStorage:", error);
  }
  return [];
}

export function setCustomRanges(ranges: Range[]) {
  try {
    localStorage.setItem("ranges", JSON.stringify(ranges));
  } catch (error) {
    console.warn("Failed to save custom ranges to localStorage:", error);
  }
}

export function getRange(id: string): Range | undefined {
  const customRanges = getCustomRanges();
  const ranges = [...customRanges, ...defaultRanges];
  return ranges.find((r) => r.id === id);
}
