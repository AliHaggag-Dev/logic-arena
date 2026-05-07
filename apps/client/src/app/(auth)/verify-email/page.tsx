"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";

function VerifyEmailContent() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success" | null;
  }>({ message: "", type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setSafeTimeout } = useSafeTimeout();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "Verifying your code...", type: null });

    try {
      await apiClient.post("/auth/verify-email", { email, code });
      setStatus({
        message: "Email verified! Taking you to login...",
        type: "success"
      });
      setSafeTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setStatus({
        message: `ERROR: ${err.response?.data?.message || err.message}`,
        type: "error"
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-bg-primary font-mono selection:bg-accent/30 relative overflow-hidden p-4 pt-16 sm:p-6 sm:pt-20">
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

        <div className={`w-full max-w-[420px] bg-card/60 backdrop-blur-xl border border-accent/20 rounded-xl ${isMobile ? "p-6" : "p-8"} relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(var(--accent-rgb),0.05)] animate-[fadeInScale_0.4s_ease-out] ${isMobile ? "shadow-[inset_3px_0_0_0_var(--accent)]" : ""}`}>

          {/* Decorative Corner Accents */}
          {!isMobile && (
            <>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/60 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/60 rounded-br-xl" />
            </>
          )}

          <div className="absolute top-3 right-4 text-[9px] text-accent/30 tracking-[0.2em] pointer-events-none">// v3.1</div>

          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-10 h-10 mb-4 border border-accent/30 rounded-full flex items-center justify-center bg-accent/5 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]">
              <span className="text-accent shadow-accent">⬢</span>
            </div>
            <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} text-accent font-black tracking-[0.2em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.6)] mb-2 uppercase`}>
              VERIFY EMAIL
            </h1>
            <h2 className="text-accent/60 text-[10px] tracking-[0.3em] uppercase">
              [ {isMobile ? "Check Inbox" : "Check your inbox for the code"} ]
            </h2>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-8">
            <div className="flex flex-col gap-3 relative text-center">
              <label className="text-[10px] text-accent/50 uppercase tracking-[0.3em] font-black" htmlFor="code">
                // ENTER YOUR CODE
              </label>
              <input
                type="text"
                id="code"
                className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-5 text-xl" : "p-4 text-2xl"} text-accent text-center tracking-[0.7em] outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:opacity-60`}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                minLength={6}
                maxLength={6}
                disabled={isLoading}
              />
              <p className="text-[10px] text-accent/30 tracking-[0.1em] mt-2">
                CODE SENT TO: {email.split('@')[0]}***@{email.split('@')[1]}
              </p>
            </div>

            {/* In-UI Status Terminal */}
            <div className="min-h-[48px] flex items-start justify-center">
              {status.message && (
                <div className={`w-full p-3.5 rounded-lg border text-[10px] tracking-[0.1em] text-center font-bold break-words transition-all ${status.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_15px_rgba(var(--color-emerald-500),0.2)]"
                  : status.type === "error"
                    ? "bg-red-500/10 border-red-500/40 text-red-500 animate-pulse"
                    : "bg-accent/10 border-accent/40 text-accent animate-pulse"
                  }`}>
                  {status.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${isMobile ? "py-5" : "py-4"} bg-accent/10 border border-accent/40 text-accent font-black text-[11px] hover:bg-accent/20 hover:border-accent/80 transition-all duration-300 rounded-lg uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(var(--accent-rgb),1)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.3)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:translate-y-0`}
              >
                {isLoading ? "VERIFYING..." : "VERIFY"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-accent/30 hover:text-accent/60 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300"
              >
                [ Request New Code ]
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}