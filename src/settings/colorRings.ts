export function getStoredColorRings(): boolean {
  try {
    return localStorage.getItem("colorRings") === "true";
  } catch (error) {
    console.warn("Failed to read color rings from localStorage:", error);
    return false;
  }
}

export function setStoredColorRings(colorRings: boolean) {
  try {
    localStorage.setItem("colorRings", String(colorRings));
  } catch (error) {
    console.warn("Failed to save color rings to localStorage:", error);
  }
}
