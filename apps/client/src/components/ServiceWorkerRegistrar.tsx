"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const register = () => {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then((reg) => console.log("[SW] Registered:", reg.scope))
                .catch((err) => console.warn("[SW] Registration failed:", err));
        };

        if (document.readyState === "complete") {
            register();
            return;
        }

        window.addEventListener("load", register, { once: true });
        return () => window.removeEventListener("load", register);
    }, []);

    return null;
}