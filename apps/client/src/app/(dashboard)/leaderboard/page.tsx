import type { Metadata } from "next";
import { LeaderboardClient } from "./LeaderboardClient";
import type { LeaderboardPageResponse } from "./types";
import { DEFAULT_PAGE_LIMIT } from "./types";

// ─── SEO ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top Logic Arena players ranked by rating points. Challenge online players and climb the global leaderboard.",
  alternates: {
    canonical: "https://logicarena.dev/leaderboard",
  },
  openGraph: {
    title: "Leaderboard | Logic Arena",
    description:
      "Top Logic Arena players ranked by rating points. Challenge online players and climb the global leaderboard.",
    url: "https://logicarena.dev/leaderboard",
  },
};

// ─── Server-side data fetch ───────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://logicarena.dev/api";

async function fetchInitialLeaderboard(): Promise<LeaderboardPageResponse> {
  const FALLBACK: LeaderboardPageResponse = {
    data: [],
    total: 0,
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    totalPages: 1,
  };

  try {
    const res = await fetch(
      `${API_BASE_URL}/users/leaderboard?page=1&limit=${DEFAULT_PAGE_LIMIT}`,
      {
        // Cache for 30 s — matches client-side poll interval
        next: { revalidate: 30 },
        // No credentials cookie on SSR; data is public
        credentials: "omit",
      },
    );
    if (!res.ok) return FALLBACK;
    const json = (await res.json()) as LeaderboardPageResponse;
    return json;
  } catch {
    return FALLBACK;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const initial = await fetchInitialLeaderboard();

  return (
    <LeaderboardClient
      initialUsers={initial.data}
      initialTotalPages={initial.totalPages}
    />
  );
}
