import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multiplayer Lobby",
  description:
    "Browse and join active multiplayer robot battles in the Logic Arena lobby.",
  alternates: {
    canonical: "https://logicarena.dev/lobby",
  },
};

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
