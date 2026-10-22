import { Color, Vector3 } from "three";
import { MapTheme } from "../../../../types";
import { MonolithThemeColors, TesseractState } from "./types";

// ---------------------------------------------------------------------------
// ARTHUR C. CLARKE 1:4:9 MONOLITH PROPORTIONS
// ---------------------------------------------------------------------------
export const BASE_UNIT = 2.6;
export const MONOLITH_DEPTH = 1 * BASE_UNIT; // 2.6  (1)
export const MONOLITH_WIDTH = 4 * BASE_UNIT; // 10.4 (4)
export const MONOLITH_HEIGHT = 9 * BASE_UNIT; // 23.4 (9)

export const MONOLITH_HALF_X = MONOLITH_WIDTH * 0.5; // 5.2
export const MONOLITH_HALF_Y = MONOLITH_HEIGHT * 0.5; // 11.7
export const MONOLITH_HALF_Z = MONOLITH_DEPTH * 0.5; // 1.3

export const MONOLITH_WORLD_POS: [number, number, number] = [430, -90, -380];
export const MONOLITH_DRIFT_SPEED = 0.28;
export const MONOLITH_DRIFT_AMPLITUDE = 4.2;
export const MONOLITH_TUMBLE_Y = 0.045;
export const MONOLITH_TUMBLE_X = 0.018;
export const MONOLITH_TUMBLE_Z = 0.012;

// ---------------------------------------------------------------------------
// 8 CASIMIR SINGULARITY NODE VERTICES
// ---------------------------------------------------------------------------
export const CASIMIR_NODE_POSITIONS: [number, number, number][] = [
  [-MONOLITH_HALF_X, MONOLITH_HALF_Y, MONOLITH_HALF_Z], // 0: Top-Left-Front
  [MONOLITH_HALF_X, MONOLITH_HALF_Y, MONOLITH_HALF_Z], // 1: Top-Right-Front
  [-MONOLITH_HALF_X, -MONOLITH_HALF_Y, MONOLITH_HALF_Z], // 2: Bottom-Left-Front
  [MONOLITH_HALF_X, -MONOLITH_HALF_Y, MONOLITH_HALF_Z], // 3: Bottom-Right-Front
  [-MONOLITH_HALF_X, MONOLITH_HALF_Y, -MONOLITH_HALF_Z], // 4: Top-Left-Back
  [MONOLITH_HALF_X, MONOLITH_HALF_Y, -MONOLITH_HALF_Z], // 5: Top-Right-Back
  [-MONOLITH_HALF_X, -MONOLITH_HALF_Y, -MONOLITH_HALF_Z], // 6: Bottom-Left-Back
  [MONOLITH_HALF_X, -MONOLITH_HALF_Y, -MONOLITH_HALF_Z], // 7: Bottom-Right-Back
];

// ---------------------------------------------------------------------------
// 12 BOUNDING EDGES CONNECTING THE 8 NODES
// ---------------------------------------------------------------------------
export const MONOLITH_EDGES: [number, number][] = [
  // 4 Top/Bottom Front & Back Horizontal Edges (X-axis)
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  // 4 Vertical Edges (Y-axis)
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  // 4 Depth Edges (Z-axis)
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

// ---------------------------------------------------------------------------
// 4D HYPERCUBE (8-CELL TESSERACT) MATHEMATICAL GENERATION
// ---------------------------------------------------------------------------
export const createTesseractGeometry = (): TesseractState => {
  const vertices4D: [number, number, number, number][] = [];
  const coords = [-1, 1];

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      for (let z = 0; z < 2; z++) {
        for (let w = 0; w < 2; w++) {
          vertices4D.push([coords[x], coords[y], coords[z], coords[w]]);
        }
      }
    }
  }

  const edges: [number, number][] = [];
  const total = vertices4D.length;
  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      let diffCount = 0;
      for (let c = 0; c < 4; c++) {
        if (vertices4D[i][c] !== vertices4D[j][c]) {
          diffCount++;
        }
      }
      if (diffCount === 1) {
        edges.push([i, j]);
      }
    }
  }

  return { vertices4D, edges };
};

export const TESSERACT_DATA = createTesseractGeometry();

/**
 * Rotates a 4D vertex via SO(4) double isoclinic rotation and stereographically
 * projects it into 3D interior volume coords bounded by the monolith's cavity.
 */
export const project4DVertex = (
  v: [number, number, number, number],
  theta1: number,
  theta2: number,
  focalDistance: number,
  target: Vector3,
): Vector3 => {
  const [x, y, z, w] = v;

  // Rotation in X-W plane
  const cos1 = Math.cos(theta1);
  const sin1 = Math.sin(theta1);
  const x1 = x * cos1 - w * sin1;
  const w1 = x * sin1 + w * cos1;

  // Rotation in Y-Z plane
  const cos2 = Math.cos(theta2);
  const sin2 = Math.sin(theta2);
  const y1 = y * cos2 - z * sin2;
  const z1 = y * sin2 + z * cos2;

  // Stereographic projection: R^4 -> R^3
  const denom = Math.max(0.2, focalDistance - w1);
  const factor = focalDistance / denom;

  // Scale within interior dimensions of the monolith
  const scaleX = MONOLITH_HALF_X * 0.72;
  const scaleY = MONOLITH_HALF_Y * 0.78;
  const scaleZ = MONOLITH_HALF_Z * 0.65;

  target.set(x1 * factor * scaleX * 0.35, y1 * factor * scaleY * 0.35, z1 * factor * scaleZ * 0.35);
  return target;
};

// ---------------------------------------------------------------------------
// THEME PALETTES
// ---------------------------------------------------------------------------
export const getMonolithThemePalette = (theme: MapTheme): MonolithThemeColors => {
  if (theme === "LAVA") {
    return {
      primary: new Color("#ff4500"), // Relativistic Solar Orange
      secondary: new Color("#ffd700"), // Coronal Gold
      subsurface: new Color("#3d0d00"), // Magmatic Obsidian SSS
      singularity: new Color("#ff1100"), // Plasma Pinch
      beamFilament: new Color("#ffaa33"), // QED Arc Gold
      ambientHalo: new Color("#ff2a00"),
      primaryHex: "#ff4500",
    };
  }
  if (theme === "ICE") {
    return {
      primary: new Color("#00d2ff"), // Absolute Zero Cerulean
      secondary: new Color("#80f0ff"), // Glacial High-Frequency Cyan
      subsurface: new Color("#00152e"), // Cryogenic Deep SSS
      singularity: new Color("#00aaff"), // Superconducting Flux
      beamFilament: new Color("#bbf2ff"), // Cryo-Plasma Diamond
      ambientHalo: new Color("#0088dd"),
      primaryHex: "#00d2ff",
    };
  }
  // Default CYBER / DEEP SPACE
  return {
    primary: new Color("#bf00ff"), // Quantum Tachyonic Purple
    secondary: new Color("#00ffff"), // Hyper-dimensional Cyan
    subsurface: new Color("#18002b"), // Deep Non-Euclidean SSS
    singularity: new Color("#ff007f"), // Casimir Singularity Magenta
    beamFilament: new Color("#e066ff"), // Relativistic Arc Violet
    ambientHalo: new Color("#9900ff"),
    primaryHex: "#bf00ff",
  };
};

// ---------------------------------------------------------------------------
// QUANTUM OBSERVER EFFECT METRIC
// ---------------------------------------------------------------------------
export const computeObserverCoupling = (
  monolithWorldPos: Vector3,
  cameraWorldPos: Vector3,
  cameraForward: Vector3,
): { proximity: number; alignment: number } => {
  const diff = new Vector3().subVectors(monolithWorldPos, cameraWorldPos);
  const dist = diff.length();
  const maxInfluenceRadius = 850;

  // Normalized direction from camera to monolith
  diff.normalize();
  const dot = Math.max(0, diff.dot(cameraForward));
  const alignment = Math.pow(dot, 3.0); // sharp alignment cone

  const proximityLinear = Math.max(0, 1 - dist / maxInfluenceRadius);
  const proximity = Math.pow(proximityLinear, 1.8);

  return { proximity, alignment };
};
