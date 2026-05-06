import { useEffect, useState, useCallback } from "react";

/** Auth keys that identify a real (non-guest) session. */
const AUTH_KEYS = ["userId", "username"] as const;
const USERNAME_KEY = "username";

function readAuthState(): { isGuest: boolean; username: string | null } {
  if (typeof window === "undefined") return { isGuest: true, username: null };
  const hasToken = AUTH_KEYS.every((k) => !!localStorage.getItem(k));
  return {
    isGuest: !hasToken,
    username: localStorage.getItem(USERNAME_KEY),
  };
}

/**
 * Returns reactive `{ isGuest, username }` that automatically updates when:
 *  1. Another tab writes/removes auth keys (StorageEvent).
 *  2. The apiClient interceptor fires the custom `auth:expired` event after a 401.
 *  3. The user explicitly logs out (same-tab localStorage.removeItem triggers the
 *     `auth:changed` custom event fired by handleLogout helpers).
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
    // Cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || AUTH_KEYS.includes(e.key as (typeof AUTH_KEYS)[number]) || e.key === USERNAME_KEY) {
        refresh();
      }
    };

    // Same-tab events (fired by apiClient interceptor and logout helpers)
    const onExpired = () => refresh();
    const onChanged = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("auth:changed", onChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:expired", onExpired);
      window.removeEventListener("auth:changed", onChanged);
    };
  }, [refresh]);

  return { ...state, refresh };
}
