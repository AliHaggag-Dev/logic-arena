import axios from "axios";
import { clearAuthSession, clearSensitiveBrowserStorage } from "./client-security";

const isDev = process.env.NODE_ENV === "development";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    || (isDev ? "http://localhost:3001/api" : "https://logicarena.dev/api");

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required to send HttpOnly cookies
});

// Do not inject Authorization headers from browser storage; auth uses HttpOnly cookies.

/**
 * Global 401 interceptor.
 * When the server rejects a request as Unauthorized we:
 *  1. Wipe auth-related in-memory state and legacy browser storage keys.
 *  2. Dispatch a custom event so any mounted `useAuthState` hook re-reads
 *     and immediately flips `isGuest = true` and `username = null` — making
 *     the UI reflect the actual session state without a page reload.
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 && typeof window !== "undefined") {
            clearSensitiveBrowserStorage();
            clearAuthSession();
            window.dispatchEvent(new Event("auth:expired"));
        }
        return Promise.reject(error);
    }
);