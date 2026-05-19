import type { LucideProps } from "lucide-react";
import { Zap, Flame, Shield, Target, Wind } from "lucide-react";
import { CombatStats } from "../../types";
import { STAT_COLORS } from "../../constants";

export interface Axis {
  key: keyof CombatStats;
  label: string;
  color: string;
  Icon: React.ComponentType<LucideProps>;
}

export const AXES: Axis[] = [
  { key: "efficiency", label: "EFFICIENCY", color: STAT_COLORS.efficiency, Icon: Zap },
  { key: "aggression", label: "AGGRESSION", color: STAT_COLORS.aggression, Icon: Flame },
  { key: "defense", label: "DEFENSE", color: STAT_COLORS.defense, Icon: Shield },
  { key: "precision", label: "PRECISION", color: STAT_COLORS.precision, Icon: Target },
  { key: "speed", label: "SPEED", color: STAT_COLORS.speed, Icon: Wind },
];

export const SIDES = 5;
export const RINGS = 5;
export const DURATION = 1200;
