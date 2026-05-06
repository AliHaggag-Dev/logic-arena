"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { clearSensitiveBrowserStorage, setAuthSession } from "../../../lib/client-security";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    // Token is no longer in the URL, it is an HttpOnly cookie set by the server.
    const userId = params.get("userId");
    const username = params.get("username");

    if (userId && username) {
      clearSensitiveBrowserStorage();
      setAuthSession({ userId, username });
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [params, router]);

  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes rotate-hex {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-mono relative overflow-hidden">
        {/* Background Grid Illusion */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Moving Scanline */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay opacity-20">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-[scanline_8s_linear_infinite]" />
        </div>

        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-[pulse-glow_2s_ease-in-out_infinite]" />
            <div className="w-12 h-12 border-t-2 border-r-2 border-accent rounded-full animate-[rotate-hex_1s_linear_infinite]" />
            <div className="absolute text-accent font-black text-xl shadow-accent">⬢</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-accent text-[12px] tracking-[0.4em] font-black animate-pulse">
              {isMobile ? "SIGNING IN..." : "ESTABLISHING CONNECTION..."}
            </div>
            <div className="text-accent/30 text-[8px] tracking-[0.2em] uppercase">
              VERIFYING ACCOUNT...
            </div>
          </div>
        </div>

        {/* Decorative corner text */}
        <div className="absolute bottom-6 left-6 text-accent/10 text-[10px] tracking-[0.5em] font-bold uppercase pointer-events-none">
          v4.0
        </div>
      </div>
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
