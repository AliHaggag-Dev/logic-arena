export type SectionId =
  | "identity"
  | "security"
  | "appearance"
  | "arena"
  | "notifications";

export const SECTIONS: { id: SectionId; label: string; shortLabel: string }[] = [
  { id: "identity", label: "MY PROFILE", shortLabel: "PROFILE" },
  { id: "security", label: "SECURITY", shortLabel: "SECURITY" },
  { id: "appearance", label: "APPEARANCE", shortLabel: "APPEARANCE" },
  { id: "arena", label: "ARENA PREFERENCES", shortLabel: "ARENA" },
  { id: "notifications", label: "NOTIFICATIONS", shortLabel: "NOTIFS" },
];

export interface FeedbackState {
  status: "idle" | "success" | "error";
  message?: string;
}
