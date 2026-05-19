import { Tournament, TMatch } from "../../../types";

export const ROUND_LABELS: Record<number, Record<number, string>> = {
  3: { 1: "QUARTER FINALS", 2: "SEMI FINALS", 3: "GRAND FINAL" },
  2: { 1: "SEMI FINALS", 2: "GRAND FINAL" },
  1: { 1: "GRAND FINAL" },
};

export interface BracketDimensions {
  m_W: number;
  m_H: number;
  r_G: number;
  m_G: number;
  totalRounds: number;
  rounds: TMatch[][];
  maxMatchesInRound: number;
  champGap: number;
  champW: number;
  svgW: number;
  svgH: number;
  matchPositions: Map<string, { x: number; y: number }>;
  lines: { x1: number; y1: number; x2: number; y2: number }[];
}

export function calcBracketDimensions(tournament: Tournament, isMobile: boolean): BracketDimensions {
  const m_W = isMobile ? 210 : 250;
  const m_H = isMobile ? 74 : 86;
  const r_G = isMobile ? 60 : 100;
  const m_G = isMobile ? 24 : 32;

  const totalRounds =
    tournament.participants.length >= 8 || tournament.matches.some((m) => m.round === 3)
      ? 3
      : tournament.participants.length >= 4
        ? 2
        : 1;

  const rounds: TMatch[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push(
      tournament.matches
        .filter((m) => m.round === r)
        .sort((a, b) => a.matchIndex - b.matchIndex)
    );
  }

  const maxMatchesInRound = Math.max(...rounds.map((r) => r.length), 1);

  const champGap = isMobile ? 20 : 40;
  const champW = isMobile ? 150 : 180;

  const baseH = maxMatchesInRound * (m_H + m_G) - m_G;
  const svgH = Math.max(baseH + 60, isMobile ? 140 : 160);

  const svgW =
    30 +
    totalRounds * (m_W + r_G) - r_G +
    (tournament.status === "COMPLETED" ? champGap + champW : 0) +
    60;

  const matchPositions = new Map<string, { x: number; y: number }>();
  rounds.forEach((roundMatches, ri) => {
    const roundTotal = roundMatches.length;
    const totalH = roundTotal * m_H + (roundTotal - 1) * m_G;
    const startY = (svgH - totalH) / 2;
    const x = 30 + ri * (m_W + r_G);
    roundMatches.forEach((m, mi) => {
      const y = startY + mi * (m_H + m_G);
      matchPositions.set(m.id, { x, y });
    });
  });

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const nextRound = rounds[ri + 1];
    if (!nextRound) continue;
    rounds[ri].forEach((m) => {
      const pos = matchPositions.get(m.id);
      if (!pos) return;
      const nextMatchIndex = Math.floor(m.matchIndex / 2);
      const nextMatch = nextRound.find((nm) => nm.matchIndex === nextMatchIndex);
      if (!nextMatch) return;
      const nextPos = matchPositions.get(nextMatch.id);
      if (!nextPos) return;

      lines.push({
        x1: pos.x + m_W,
        y1: pos.y + m_H / 2,
        x2: nextPos.x,
        y2: nextPos.y + m_H / 2,
      });
    });
  }

  return { m_W, m_H, r_G, m_G, totalRounds, rounds, maxMatchesInRound, champGap, champW, svgW, svgH, matchPositions, lines };
}
