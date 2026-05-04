export interface RobotConfig {
  id: string;
  name: string;
  file: string;
  /** Scale used by the RobotViewer on the detail page */
  scale: number;
  /** Scale used by the RobotCard Canvas preview on the list page */
  cardScale: number;
  description: string;
  classification: string;
}

export const ROBOTS: RobotConfig[] = [
  {
    id: "unit-01",
    name: "UNIT-01",
    file: "/robots/robot.glb",
    scale: 2.5,
    cardScale: 2.5,
    description: "Balanced offense and defense.",
    classification: "COMBAT CHASSIS",
  },
  {
    id: "unit-02",
    name: "UNIT-02",
    file: "/robots/robot2.glb",
    scale: 1.4,
    cardScale: 1.2,
    description: "High mobility, reduced armor.",
    classification: "ASSAULT FRAME",
  },
];

export const ROBOTS_MAP: Record<string, RobotConfig> = Object.fromEntries(
  ROBOTS.map((r) => [r.id, r])
);

export const GUEST_ROBOT: RobotConfig = {
  id: "guest-unit",
  name: "GUEST UNIT",
  file: "/robots/robot.glb",
  scale: 2.5,
  cardScale: 2.5,
  description: "Register to unlock full access.",
  classification: "LOCKED CHASSIS",
};

/** Fallback hex when THREE.Color() parsing fails */
export const FALLBACK_COLOR = "#22d3ee";

/** Toast auto-dismiss duration in milliseconds */
export const TOAST_DURATION_MS = 3_200;

/** Unified mobile breakpoint used across all garage pages */
export const MOBILE_BREAKPOINT = "(max-width: 1024px)";
