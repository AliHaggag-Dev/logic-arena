"use client";

import DOMPurify from "isomorphic-dompurify";

type AuthSession = {
    isAuthenticated?: boolean;
    userId: string | null;
    username: string | null;
};

const authSession: AuthSession = {
    isAuthenticated: false,
    userId: null,
    username: null,
};

let selectedScriptId: string | null = null;

export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["div", "span", "br"],
        ALLOWED_ATTR: ["class", "style"],
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "src", "href", "xlink:href"],
    });
}

export function setAuthSession(nextSession: AuthSession): void {
    authSession.isAuthenticated = Boolean(nextSession.isAuthenticated ?? nextSession.userId ?? nextSession.username);
    authSession.userId = nextSession.userId;
    authSession.username = nextSession.username;
    window.dispatchEvent(new Event("auth:changed"));
}

export function clearAuthSession(): void {
    authSession.isAuthenticated = false;
    authSession.userId = null;
    authSession.username = null;
    window.dispatchEvent(new Event("auth:changed"));
}

export function getAuthSession(): AuthSession {
    return { ...authSession };
}

export function hasAuthSession(): boolean {
    return Boolean(authSession.isAuthenticated);
}

export function getAuthUserId(): string | null {
    return authSession.userId;
}

export function getAuthUsername(): string | null {
    return authSession.username;
}

export function setSelectedScriptId(scriptId: string | null): void {
    selectedScriptId = scriptId;
}

export function getSelectedScriptId(): string | null {
    return selectedScriptId;
}

export function clearSensitiveBrowserStorage(): void {
    if (typeof window === "undefined") return;

    ["userId", "username", "email", "token", "jwtToken", "selectedScriptId"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}