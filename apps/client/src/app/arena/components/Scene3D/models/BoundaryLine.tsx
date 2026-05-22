"use client";
import { useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import { BoundaryLineProps } from "../../../types";

const BOUNDARY_CORNERS: [number, number, number][] = [
  [-10, 0, -7.5],
  [10,  0, -7.5],
  [10,  0,  7.5],
  [-10, 0,  7.5],
  [-10, 0, -7.5], // close the loop
];

const BOUNDARY_COLOR = "#00FFFF";
const BOUNDARY_LINE_WIDTH = 2;

/**
 * Renders the arena boundary as a thick neon rectangle.
 * Uses drei's <Line> (LineMaterial) which correctly supports lineWidth on WebGL,
 * unlike the native <lineLoop> whose linewidth is always 1px on most drivers.
 */
export const BoundaryLine = ({ points: _points }: BoundaryLineProps) => {
  const lineRef = useRef<Line2>(null);

  useFrame(state => {
    const pulse = 0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 2);
    if (lineRef.current?.material) {
      (lineRef.current.material as { opacity?: number }).opacity = pulse;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={BOUNDARY_CORNERS}
      color={BOUNDARY_COLOR}
      lineWidth={BOUNDARY_LINE_WIDTH}
      transparent
      opacity={0.9}
    />
  );
};
