"use client";

import DOMPurify from "isomorphic-dompurify";

type AuthSession = {
    isAuthenticated?: boolean;
    userId: string | null;
    username: string | null;
    avatarUrl?: string | null;
};

const authSession: AuthSession = {
    isAuthenticated: false,
    userId: null,
    username: null,
    avatarUrl: null,
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
    authSession.avatarUrl = nextSession.avatarUrl ?? authSession.avatarUrl ?? null;
    
    // Persist non-sensitive public data to prevent UI hydration flicker
    if (typeof window !== "undefined") {
        if (nextSession.username) localStorage.setItem("logic_arena_display_name", nextSession.username);
        if (nextSession.avatarUrl) localStorage.setItem("logic_arena_avatar", nextSession.avatarUrl);
    }
    window.dispatchEvent(new Event("auth:changed"));
}

export function clearAuthSession(): void {
    authSession.isAuthenticated = false;
    authSession.userId = null;
    authSession.username = null;
    authSession.avatarUrl = null;
    
    if (typeof window !== "undefined") {
        localStorage.removeItem("logic_arena_display_name");
        localStorage.removeItem("logic_arena_avatar");
    }
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
    if (authSession.username) return authSession.username;
    if (typeof window !== "undefined") return localStorage.getItem("logic_arena_display_name");
    return null;
}

export function getAuthAvatarUrl(): string | null {
    if (authSession.avatarUrl) return authSession.avatarUrl;
    if (typeof window !== "undefined") return localStorage.getItem("logic_arena_avatar");
    return null;
}

export function setSelectedScriptId(scriptId: string | null): void {
    selectedScriptId = scriptId;
    if (typeof window !== "undefined") {
        if (scriptId) {
            localStorage.setItem("selectedScriptId", scriptId);
        } else {
            localStorage.removeItem("selectedScriptId");
        }
    }
}

export function getSelectedScriptId(): string | null {
    if (selectedScriptId) return selectedScriptId;
    if (typeof window !== "undefined") {
        selectedScriptId = localStorage.getItem("selectedScriptId");
        return selectedScriptId;
    }
    return null;
}

export function clearSensitiveBrowserStorage(): void {
    if (typeof window === "undefined") return;

    ["userId", "username", "email", "token", "jwtToken", "selectedScriptId"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}