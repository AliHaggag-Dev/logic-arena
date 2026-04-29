export interface Player {
  id: string;
  username: string;
}

export interface TMatch {
  id: string;
  round: number;
  matchIndex: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  status: string;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
}

export interface Tournament {
  id: string;
  name: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
  creatorId: string;
  creator: Player;
  participants: Player[];
  matches: TMatch[];
  winnerId: string | null;
  createdAt?: string; // Added from TournamentCard
}
