import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../../lib/api-client";
import { Tournament } from "../../types";

const POLL_INTERVAL_MS = 10_000;

export function useTournamentDetail(id: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await apiClient.get(`/tournaments/${id}`);
      setTournament(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        setIsGuest(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
    const interval = setInterval(fetchTournament, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const handleStart = async () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setStartError(null);
    try {
      await apiClient.post(`/tournaments/${id}/start`);
      fetchTournament();
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number, data?: { message?: string } } };
      if (axiosError.response?.status === 401) {
        setIsGuest(true);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setUserId(null);
        setShowAuthModal(true);
        setStartError(null);
      } else {
        setStartError(axiosError.response?.data?.message || "Failed to start tournament");
      }
    }
  };

  const handleSimulateWin = async (matchId: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    if (!userId) return;
    setSimulating(matchId);
    try {
      await apiClient.post(`/tournaments/${id}/matches/${matchId}/complete`, { winnerId: userId });
      fetchTournament();
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        setIsGuest(true);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setUserId(null);
        setShowAuthModal(true);
      }
    } finally {
      setSimulating(null);
    }
  };

  const myMatch =
    tournament?.status === "IN_PROGRESS" && userId
      ? tournament.matches.find(
          (m) =>
            m.status !== "COMPLETED" &&
            (m.player1Id === userId || m.player2Id === userId) &&
            m.player1Id &&
            m.player2Id
        ) || null
      : null;

  const myOpponent =
    myMatch && userId
      ? myMatch.player1Id === userId
        ? myMatch.player2
        : myMatch.player1
      : null;

  return {
    tournament,
    loading,
    userId,
    simulating,
    isGuest,
    showAuthModal,
    startError,
    setShowAuthModal,
    handleStart,
    handleSimulateWin,
    myMatch,
    myOpponent,
  };
}
