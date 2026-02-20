import { getRange, Range } from "../ranges/ranges";

export function getLastUsedRange(): Range | undefined {
  try {
    const stored = localStorage.getItem("lastUsedRange");
    if (typeof stored !== "string") {
      return undefined;
    }
    return getRange(stored);
  } catch (error) {
    console.warn("Failed to read last used range from localStorage:", error);
    return undefined;
  }
}

export function setLastUsedRange(range: Range) {
  try {
    localStorage.setItem("lastUsedRange", range.id);
  } catch (error) {
    console.warn("Failed to save last used range to localStorage:", error);
  }
}
