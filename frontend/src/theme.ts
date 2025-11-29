import type { Theme } from "./types";

export const theme: Theme = {
  primary: "#2D67FF",
  highlight: "#FF8C00"
};

export function getContrastText(colorHex: string): string {
  const hex = colorHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#1f2937" : "#ffffff";
}
