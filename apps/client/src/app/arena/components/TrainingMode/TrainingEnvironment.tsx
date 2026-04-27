"use client";
import React from "react";

/**
 * Training-mode 3D scene addons.
 * Deliberately minimal — the "TRAINING FACILITY" banner and corner decorations
 * are rendered as a CSS overlay on the page instead of as 3D Html elements,
 * which eliminates z-fighting / occlusion issues with the map geometry.
 */
export const TrainingEnvironment = ({ width: _width, height: _height }: { width: number; height: number }) => {
  return (
    <>
      {/* Subdued cyan ambient fill specific to training */}
      <ambientLight intensity={0.4} color="#00ffff" />
    </>
  );
};
