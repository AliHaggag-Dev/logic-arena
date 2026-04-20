"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, API_BASE_URL } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

// ---------------------------------------------------------------------------
// Extracts clean, human-readable messages from both our ZodValidationPipe
// ({ messages: string[] }) and NestJS built-in exceptions ({ message: string }).
// ---------------------------------------------------------------------------
function parseApiError(error: any): string[] {
  const data = error?.response?.data;
  if (!data) return [error?.message ?? "An unexpected error occurred"];
  if (Array.isArray(data.messages) && data.messages.length > 0) return data.messages;
  if (Array.isArray(data.message)) return data.message as string[];
  if (typeof data.message === "string") return [data.message];
  return [error?.message ?? "An unexpected error occurred"];
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    errors: string[];
    type: "error" | "success" | null;
  }>({ message: "", errors: [], type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "AUTHENTICATING CREDENTIALS...", errors: [], type: null });

    try {
      const response = await apiClient.post("/auth/login", { username, password });
      const token = response.data.accessToken;

      // Decode JWT to get userId
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        localStorage.setItem("userId", payload.sub);
        localStorage.setItem("username", payload.username || username);
      } catch (e) {
        console.error("Failed to decode token", e);
      }

      localStorage.setItem("jwtToken", token);
      localStorage.setItem("token", token);

      setStatus({ message: "[SYS] ACCESS GRANTED. REROUTING...", errors: [], type: "success" });
      setTimeout(() => router.push("/dashboard"), 1000);

    } catch (error: any) {
      const errs = parseApiError(error);
      console.error("Login failed:", errs);
      setStatus({ message: "", errors: errs, type: "error" });
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

        <div className={`w-full max-w-[420px] bg-card/60 backdrop-blur-xl border border-accent/20 rounded-xl ${isMobile ? "p-6" : "p-8"} relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(var(--accent-rgb),0.05)] animate-[fadeInScale_0.4s_ease-out] ${isMobile ? "shadow-[inset_3px_0_0_0_var(--accent)]" : ""}`}>

          {/* Decorative Corner Accents */}
          {!isMobile && (
            <>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/60 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/60 rounded-br-xl" />
            </>
          )}

          <div className="absolute top-3 right-4 text-[9px] text-accent/30 tracking-[0.2em] pointer-events-none">AUTH_NODE_V2.1</div>

          <div className={`mb-10 text-center flex flex-col items-center`}>
            <div className="w-10 h-10 mb-4 border border-accent/30 rounded-full flex items-center justify-center bg-accent/5 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]">
              <span className="text-accent shadow-accent">⬡</span>
            </div>
            <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} text-accent font-black tracking-[0.2em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.6)] mb-2 uppercase`}>
              LOGIC ARENA
            </h1>
            <h2 className="text-accent/70 text-[10px] tracking-[0.3em] uppercase">
              [ {isMobile ? "SYNC_OP" : "Authenticate Operator"} ]
            </h2>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <a
              href={`${API_BASE_URL}/auth/google`}
              className={`flex items-center justify-center gap-3 w-full ${isMobile ? "py-4" : "py-3"} border border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent/70 hover:text-accent text-[11px] tracking-[0.2em] font-mono transition-all rounded-lg active:scale-[0.98]`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isMobile ? "LINK_GOOGLE" : "CONTINUE WITH GOOGLE"}
            </a>

            <a
              href={`${API_BASE_URL}/auth/github`}
              className={`flex items-center justify-center gap-3 w-full ${isMobile ? "py-4" : "py-3"} border border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent/70 hover:text-accent text-[11px] tracking-[0.2em] font-mono transition-all rounded-lg active:scale-[0.98]`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {isMobile ? "LINK_GITHUB" : "CONTINUE WITH GITHUB"}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-6 opacity-30">
            <div className="flex-1 h-px bg-accent" />
            <span className="text-[10px] tracking-[0.2em] text-accent font-bold">OR</span>
            <div className="flex-1 h-px bg-accent" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] text-accent/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="username">
                // OPERATOR_ID
              </label>
              <input
                type="text"
                id="username"
                className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-20 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
                placeholder="SPECIFY_ALIAS..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] text-accent/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="password">
                // SEC_KEY_ENCRYPT
              </label>
              <input
                type="password"
                id="password"
                className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-20 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* In-UI Status Terminal */}
            <div className="min-h-[48px] flex items-start justify-center">
              {status.message && (
                <div className={`w-full p-3.5 rounded-lg border text-[10px] tracking-[0.1em] text-center font-bold break-words transition-all ${status.type === "success"
                    ? "bg-accent/10 border-accent/40 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
                    : "bg-accent/10 border-accent/40 text-accent animate-pulse"
                  }`}>
                  {status.message}
                </div>
              )}

              {status.errors.length > 0 && (
                <div className="w-full p-3.5 rounded-lg border bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(var(--color-red-500),0.15)] space-y-1">
                  {status.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] tracking-[0.08em] font-black text-red-500 uppercase break-words">
                      <span className="shrink-0 opacity-50">›</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex flex-col gap-5 ${isMobile ? "pt-0" : "pt-2"}`}>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${isMobile ? "py-5" : "py-4"} bg-accent/10 border border-accent/40 text-accent font-black text-[11px] hover:bg-accent/20 hover:border-accent/80 transition-all duration-300 rounded-lg uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.3)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed`}
              >
                {isLoading ? "VERIFYING_ENCRYPTION..." : "INITIATE_LOGIN_PROTOCOL"}
              </button>

              <div className="text-center flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-accent/40 hover:text-accent text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
                >
                  [ Request_Access ]
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-red-500/40 hover:text-red-500 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--color-red-500),0.6)]"
                >
                  [ Lost_Key?_Reset ]
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}