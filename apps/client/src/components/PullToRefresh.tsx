"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const THRESHOLD = 72;
const MAX_PULL = 110;

type Phase = "idle" | "pulling" | "ready" | "loading";

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [pullY, setPullY] = useState(0);

    const router = useRouter();
    const pathname = usePathname();
    const startYRef = useRef(0);
    const phaseRef = useRef<Phase>("idle");
    const isLandscapeRef = useRef(false);

    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // track orientation via listener — zero per-touch overhead
    useEffect(() => {
        const mq = window.matchMedia("(orientation: landscape)");
        isLandscapeRef.current = mq.matches;
        const handler = (e: MediaQueryListEvent) => { isLandscapeRef.current = e.matches; };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        const isDisabled = () =>
            pathname?.startsWith("/arena") ||
            isLandscapeRef.current;

        const isAtTop = () => window.scrollY <= 0;

        const onTouchStart = (e: TouchEvent) => {
            if (isDisabled() || !isAtTop()) return;
            startYRef.current = e.touches[0].clientY;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (isDisabled() || phaseRef.current === "loading" || !isAtTop()) return;

            const delta = e.touches[0].clientY - startYRef.current;
            if (delta <= 0) {
                if (phaseRef.current !== "idle") { setPhase("idle"); setPullY(0); }
                return;
            }

            // Native-feeling rubber-band resistance curve
            // It asymptotically approaches 'c' without ever dipping back down
            const c = 200;
            const eased = (c * delta) / (delta + c);
            setPullY(eased);
            setPhase(eased >= THRESHOLD ? "ready" : "pulling");
            e.preventDefault();
        };

        const onTouchEnd = () => {
            if (isDisabled()) return;

            if (phaseRef.current === "ready") {
                setPhase("loading");
                setPullY(76);
                
                // 1. Refetch Server Components (if any)
                router.refresh();
                // 2. Dispatch custom event to remount Client Components and trigger their useEffects instantly
                window.dispatchEvent(new Event("global-refresh"));
                
                setTimeout(() => { setPhase("idle"); setPullY(0); }, 1000);
            } else {
                setPhase("idle");
                setPullY(0);
            }
        };

        document.addEventListener("touchstart", onTouchStart, { passive: true });
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd, { passive: true });
        return () => {
            document.removeEventListener("touchstart", onTouchStart);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", onTouchEnd);
        };
    }, [router, pathname]);

    const isActive = !pathname?.startsWith("/arena");
    const progress = Math.min(1, pullY / THRESHOLD);
    const opacity = phase === "idle" ? 0 : phase === "loading" ? 1 : Math.min(1, progress * 1.5);
    const isSpinning = phase === "loading";

    return (
        <>
            {isActive && (
                <div
                    aria-hidden
                    style={{
                        position: "fixed",
                        top: 0,
                        left: "50%",
                        transform: `translateX(-50%) translateY(${pullY - 56}px)`,
                        transition: phase === "idle" || phase === "loading"
                            ? "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease"
                            : "none",
                        zIndex: 9999,
                        width: 42,
                        height: 42,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity,
                        pointerEvents: "none",
                        background: "rgba(var(--bg-primary-rgb), 0.85)",
                        backdropFilter: "blur(12px)",
                        borderRadius: "50%",
                        border: "1px solid rgba(var(--accent-rgb), 0.15)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20" height="20" viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ 
                            animation: isSpinning ? "ptr-spin 0.75s linear infinite" : "none",
                            transform: isSpinning ? "none" : `rotate(${progress * 220}deg)`
                        }}
                    >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                    </svg>
                </div>
            )}

            {children}

            <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}