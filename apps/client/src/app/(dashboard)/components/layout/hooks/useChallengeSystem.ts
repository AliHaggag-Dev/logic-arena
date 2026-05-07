import { useState, useCallback, useEffect } from "react";
import { useGlobalSocket } from "../../../../../hooks/useGlobalSocket";
import { apiClient } from "../../../../../lib/api-client";
import { useSafeTimeout } from "../../../../../hooks/useSafeTimeout";

export function useChallengeSystem() {
  const [incomingChallenge, setIncoming] = useState<{ challengerId: string; challengerName: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "info" | "error" } | null>(null);
  const [allowChallenges, setAllowChallenges] = useState(true);
  const { clearAllSafeTimeouts, setSafeTimeout } = useSafeTimeout();

  useEffect(() => {
    let cancelled = false;

    apiClient.get('/users/profile').then(res => {
      if (cancelled) return;
      const ns = res.data.notificationSettings;
      if (ns) {
        setAllowChallenges(ns.challengeReqs !== false);
      }
    }).catch(() => { });

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((message: string, type: "info" | "error" = "info") => {
    clearAllSafeTimeouts();
    setToast({ message, type });
    setSafeTimeout(() => setToast(null), 3500);
  }, [clearAllSafeTimeouts, setSafeTimeout]);

  const { sendChallenge, acceptChallenge } = useGlobalSocket({
    onChallengeReceived: (data) => {
      if (allowChallenges) setIncoming(data);
    },
    onChallengeSent: () => showToast("⚔ CHALLENGE SENT — AWAITING RESPONSE"),
    onChallengeFailed: () => showToast("TARGET IS OFFLINE", "error"),
    onChallengeAccepted: () => showToast("CHALLENGE ACCEPTED — DEPLOYING TO ARENA"),
  });

  return { incomingChallenge, setIncoming, toast, sendChallenge, acceptChallenge };
}
