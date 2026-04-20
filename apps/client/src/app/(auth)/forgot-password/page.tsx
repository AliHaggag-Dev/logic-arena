"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success" | null;
  }>({ message: "", type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "INITIATING_RECOVERY_PROTOCOL...", type: null });

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus({ 
        message: "[SYS] RESET_LINK_TRANSMITTED. CHECK COMMS.", 
        type: "success" 
      });
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1500);
    } catch (err: any) {
      setStatus({ 
        message: `[ERR] ${err.response?.data?.message || err.message}`, 
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
      
      <div className="min-h-screen flex items-center justify-center bg-bg-primary font-mono selection:bg-accent/30 relative overflow-hidden p-4 sm:p-6">
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

        <div className={`w-full max-w-[420px] bg-card/60 backdrop-blur-xl border border-accent/20 rounded-xl ${isMobile ? "p-6" : "p-8"} relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(var(--accent-rgb),0.05)] animate-[fadeInScale_0.4s_ease-out] ${isMobile ? "shadow-[inset_3px_0_0_0_var(--color-red-500)]" : ""}`}>
          
          {/* Decorative Corner Accents */}
          {!isMobile && (
            <>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500/40 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500/40 rounded-br-xl" />
            </>
          )}
          
          <div className="absolute top-3 right-4 text-[9px] text-red-500/30 tracking-[0.2em] pointer-events-none">RECOVERY_NODE_V1.0</div>

          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-10 h-10 mb-4 border border-red-500/30 rounded-full flex items-center justify-center bg-red-500/5 shadow-[0_0_15px_rgba(var(--color-red-500),0.15)]">
              <span className="text-red-500 shadow-red">⚠</span>
            </div>
            <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} text-red-500 font-black tracking-[0.2em] drop-shadow-[0_0_10px_rgba(var(--color-red-500),0.6)] mb-2 uppercase`}>
              RECOVER_ID
            </h1>
            <h2 className="text-red-500/60 text-[10px] tracking-[0.3em] uppercase">
              [ Initiate Credentials Reset ]
            </h2>
          </div>

          <form onSubmit={handleForgot} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] text-red-500/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="email">
                // COMMS_LINK_ENCRYPT
              </label>
              <input
                type="email"
                id="email"
                className={`w-full bg-bg-primary/80 border border-red-500/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-red-500 outline-none focus:border-red-500/60 focus:bg-red-500/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-20 focus:shadow-[0_0_20px_rgba(var(--color-red-500),0.1)]`}
                placeholder="OPERATOR@NETWORK.LOCAL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* In-UI Status Terminal */}
            <div className="min-h-[48px] flex items-start justify-center">
              {status.message && (
                <div className={`w-full p-3.5 rounded-lg border text-[10px] tracking-[0.1em] text-center font-bold break-words transition-all ${
                  status.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_15px_rgba(var(--color-emerald-500),0.2)]"
                    : status.type === "error"
                    ? "bg-red-500/10 border-red-500/40 text-red-500 animate-pulse"
                    : "bg-accent/10 border-accent/40 text-accent animate-pulse"
                }`}>
                  {status.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${isMobile ? "py-5" : "py-4"} bg-red-500/10 border border-red-500/40 text-red-500 font-black text-[11px] hover:bg-red-500/20 hover:border-red-500/80 transition-all duration-300 rounded-lg uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(var(--color-red-500),0.1)] hover:shadow-[0_0_25px_rgba(var(--color-red-500),0.3)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:translate-y-0`}
              >
                {isLoading ? "TRANSMITTING..." : "GENERATE_RESET_TOKEN"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-accent/40 hover:text-accent text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
              >
                [ Return_To_Base ]
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
