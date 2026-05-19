import { SIDES } from "./RadarChart.constants";

export function polarToCartesian(
  cx: number, cy: number, r: number, angleRad: number,
): { x: number; y: number } {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

export function getAngle(i: number): number {
  return (Math.PI * 2 * i) / SIDES - Math.PI / 2;
}
