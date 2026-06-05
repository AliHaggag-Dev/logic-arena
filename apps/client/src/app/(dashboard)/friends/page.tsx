"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthState } from "../../../hooks/useAuthState";
import { useFriendsSystem } from "../../../hooks/useFriendsSystem";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSocket } from "../../../context/SocketContext";
import { FriendsTabs } from "./components/FriendsTabs";

export default function FriendsPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isGuest, userId } = useAuthState();
  const currentUserId = userId ?? "";
  const { sendChallenge } = useSocket();

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    suggestions,
    isLoadingFriends,
    isLoadingRequests,
    isLoadingSuggestions,
    sentSuggestionIds,
    fetchSuggestions,
    acceptRequest,
    declineRequest,
    unfriend,
    markSuggestionSent,
    clearSuggestionSent,
  } = useFriendsSystem();

  const [showRequestSentToast, setShowRequestSentToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (!errorToast) return;
    const t = window.setTimeout(() => setErrorToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [errorToast]);

  const handleSuggestionsError = useCallback((message: string) => {
    setErrorToast(message);
  }, []);

  useEffect(() => {
    if (isGuest) {
      router.replace("/login");
    }
  }, [isGuest, router]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  const handleSpectate = useCallback(
    (matchId: string) => {
      router.push(`/arena?matchId=${matchId}&spectate=true`);
    },
    [router],
  );

  const handleRequestSent = useCallback(
    async (username: string) => {
      setShowRequestSentToast(username);
      window.setTimeout(() => setShowRequestSentToast(null), 2500);
      void fetchSuggestions();
    },
    [fetchSuggestions],
  );

  if (isGuest) return null;

  return (
    <div
      className={`min-h-screen bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}
    >
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className={`relative z-20 ${isMobile ? "px-4 pt-4" : "max-w-5xl mx-auto pt-12 px-6"}`}
      >
        <div className={`${isMobile ? "mb-4 pb-3" : "mb-8 pb-6"} border-b border-accent/20`}>
          <h1
            className={`text-accent font-black tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] ${isMobile ? "text-xl" : "text-4xl"}`}
          >
            ALLIANCE NETWORK
          </h1>
          <p className="text-accent/60 text-[10px] tracking-widest uppercase mt-2">
            Friends · Requests · Suggestions
          </p>
        </div>

        <FriendsTabs
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          suggestions={suggestions}
          isLoadingFriends={isLoadingFriends}
          isLoadingRequests={isLoadingRequests}
          isLoadingSuggestions={isLoadingSuggestions}
          isMobile={isMobile}
          sentSuggestionIds={sentSuggestionIds}
          onChallenge={(targetUserId) => sendChallenge(targetUserId, 'friend')}
          onSpectate={handleSpectate}
          onUnfriend={unfriend}
          onAcceptRequest={acceptRequest}
          onDeclineRequest={declineRequest}
          onRequestSent={handleRequestSent}
          onSuggestionsError={handleSuggestionsError}
          onMarkSuggestionSent={markSuggestionSent}
          onClearSuggestionSent={clearSuggestionSent}
        />
      </div>

      {showRequestSentToast && (
        <div
          className="fixed left-1/2 z-[100] font-mono text-[11px] tracking-[0.15em] px-5 py-3 rounded-lg border pointer-events-none"
          style={{
            bottom: isMobile ? "96px" : "24px",
            transform: "translateX(-50%)",
            animation: "fadeInUp 0.25s ease",
            background: "rgba(var(--sem-success-rgb),0.10)",
            borderColor: "rgba(var(--sem-success-rgb),0.35)",
            color: "var(--sem-success)",
            boxShadow: "0 0 20px rgba(var(--sem-success-rgb),0.15)",
          }}
        >
          ✓ REQUEST SENT TO {showRequestSentToast}
        </div>
      )}

      {errorToast && (
        <div
          role="alert"
          className="fixed left-1/2 z-[100] font-mono text-[11px] tracking-[0.15em] px-5 py-3 rounded-lg border pointer-events-none"
          style={{
            bottom: isMobile ? "96px" : "24px",
            transform: "translateX(-50%)",
            animation: "fadeInUp 0.25s ease",
            background: "rgba(var(--sem-danger-rgb),0.10)",
            borderColor: "rgba(var(--sem-danger-rgb),0.35)",
            color: "var(--sem-danger)",
            boxShadow: "0 0 20px rgba(var(--sem-danger-rgb),0.15)",
          }}
        >
          ⚠ {errorToast}
        </div>
      )}

      <div aria-hidden="true" className="hidden">{currentUserId}</div>
    </div>
  );
}
