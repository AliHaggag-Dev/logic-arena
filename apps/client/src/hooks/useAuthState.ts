import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/api-client";
import { clearAuthSession, getAuthSession, setAuthSession } from "../lib/client-security";

function readAuthState(): { isGuest: boolean; username: string | null } {
  const session = getAuthSession();
  return {
    isGuest: !session.isAuthenticated,
    username: session.username,
  };
}

/**
 * Returns reactive `{ isGuest, username }` backed by in-memory session metadata.
 * Sensitive account identifiers are intentionally never persisted to localStorage.
 */
export function useAuthState(): {
  isGuest: boolean;
  username: string | null;
  refresh: () => void;
} {
  const [state, setState] = useState(readAuthState);

  const refresh = useCallback(() => {
    setState(readAuthState());
  }, []);

  useEffect(() => {
    if (getAuthSession().userId) return;

    let cancelled = false;
    apiClient.get("/users/profile").then((res) => {
      if (cancelled) return;
      setAuthSession({
        isAuthenticated: true,
        userId: res.data.id ?? null,
        username: res.data.username ?? null,
      });
      refresh();
    }).catch(() => {
      if (!cancelled) {
        clearAuthSession();
        refresh();
      }
    });

    return () => { cancelled = true; };
  }, [refresh]);

  useEffect(() => {
    const onExpired = () => refresh();
    const onChanged = () => refresh();

    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("auth:changed", onChanged);

    return () => {
      window.removeEventListener("auth:expired", onExpired);
      window.removeEventListener("auth:changed", onChanged);
    };
  }, [refresh]);

  return { ...state, refresh };
}
