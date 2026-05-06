import axios from "axios";

const isDev = process.env.NODE_ENV === "development";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    || (isDev ? "http://localhost:3001/api" : "https://logicarena.dev/api");

/** Keys cleared when the server returns 401 (session expired / invalid token). */
const AUTH_STORAGE_KEYS = ["userId", "username"] as const;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required to send HttpOnly cookies
});

// Remove request interceptor that injects Authorization header from localStorage

/**
 * Global 401 interceptor.
 * When the server rejects a request as Unauthorized we:
 *  1. Wipe all auth-related localStorage keys so the next read sees "guest".
 *  2. Dispatch a custom event so any mounted `useAuthState` hook re-reads
 *     and immediately flips `isGuest = true` and `username = null` — making
 *     the UI reflect the actual session state without a page reload.
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 && typeof window !== "undefined") {
            AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
            window.dispatchEvent(new Event("auth:expired"));
        }
        return Promise.reject(error);
    }
);