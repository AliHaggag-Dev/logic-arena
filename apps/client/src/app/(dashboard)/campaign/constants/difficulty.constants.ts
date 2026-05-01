export const DIFFICULTY_CONFIG: Record<string, {
  text: string;
  border: string;
  glow: string;
  color: string;
  label: string;
}> = {
  EASY: {
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    glow: "rgba(var(--color-emerald-500),0.6)",
    color: "var(--color-emerald-500)",
    label: "EASY"
  },
  MEDIUM: {
    text: "text-yellow-500",
    border: "border-yellow-500/30",
    glow: "rgba(var(--color-yellow-500),0.6)",
    color: "var(--color-yellow-500)",
    label: "MEDIUM"
  },
  HARD: {
    text: "text-orange-500",
    border: "border-orange-500/30",
    glow: "rgba(var(--color-orange-500),0.6)",
    color: "var(--color-orange-500)",
    label: "HARD"
  },
  ELITE: {
    text: "text-red-500",
    border: "border-red-500/30",
    glow: "rgba(var(--color-red-500),0.6)",
    color: "var(--color-red-500)",
    label: "ELITE"
  },
};
