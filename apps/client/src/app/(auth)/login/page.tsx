"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

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
    errors:  string[];
    type: "error" | "success" | null;
  }>({ message: "", errors: [], type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      
      <div className="min-h-screen flex items-center justify-center bg-[#030712] font-mono selection:bg-[#22d3ee]/30 relative overflow-hidden p-6">
        {/* Background Grid Illusion */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(8,145,178,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px' 
          }}
        />
        
        {/* Moving Scanline */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay opacity-20">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent animate-[scanline_8s_linear_infinite]" />
        </div>

        <div className="w-full max-w-[420px] bg-black/60 backdrop-blur-xl border border-[#22d3ee]/20 rounded-xl p-8 relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(34,211,238,0.05)] animate-[fadeInScale_0.4s_ease-out]">
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#22d3ee]/60 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#22d3ee]/60 rounded-br-xl" />
          
          <div className="absolute top-3 right-4 text-[8px] text-[#22d3ee]/30 tracking-[0.2em] pointer-events-none">AUTH_NODE_V1</div>

          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-10 h-10 mb-4 border border-[#22d3ee]/30 rounded-full flex items-center justify-center bg-[#22d3ee]/5 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <span className="text-[#22d3ee] shadow-[#22d3ee]">⬡</span>
            </div>
            <h1 className="text-[#22d3ee] font-black text-3xl tracking-[0.2em] drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] mb-2">
              LOGIC ARENA
            </h1>
            <h2 className="text-[#22c55e]/70 text-[10px] tracking-[0.3em] uppercase">
              [ Authenticate Operator ]
            </h2>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[9px] text-[#22d3ee]/60 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="username">
                Operator Name
              </label>
              <input
                type="text"
                id="username"
                className="w-full bg-[#030712]/80 border border-[#22d3ee]/20 rounded-lg p-3.5 text-[#22d3ee] outline-none focus:border-[#22d3ee]/60 focus:bg-[#22d3ee]/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder-[#22d3ee]/20 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                placeholder="Enter designated alias"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[9px] text-[#22d3ee]/60 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="password">
                Security Key
              </label>
              <input
                type="password"
                id="password"
                className="w-full bg-[#030712]/80 border border-[#22d3ee]/20 rounded-lg p-3.5 text-[#22d3ee] outline-none focus:border-[#22d3ee]/60 focus:bg-[#22d3ee]/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder-[#22d3ee]/20 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* In-UI Status Terminal */}
            <div className="min-h-[44px] flex items-start justify-center">
              {/* Loading / success single-line message */}
              {status.message && (
                <div className={`w-full p-3 rounded-md border text-[10px] tracking-[0.1em] text-center font-bold break-words transition-all ${
                  status.type === "success"
                    ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                    : "bg-[#22d3ee]/10 border-[#22d3ee]/40 text-[#22d3ee] animate-pulse"
                }`}>
                  {status.message}
                </div>
              )}

              {/* Validation / auth error list */}
              {status.errors.length > 0 && (
                <div className="w-full p-3 rounded-md border bg-[#ef4444]/10 border-[#ef4444]/40 shadow-[0_0_10px_rgba(239,68,68,0.15)] space-y-1">
                  {status.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[9px] tracking-[0.08em] font-bold text-[#ef4444] break-words">
                      <span className="shrink-0 mt-px opacity-70">›</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] font-black text-[11px] hover:bg-[#22c55e]/20 hover:border-[#22c55e]/80 transition-all duration-300 rounded-lg uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed group"
              >
                {isLoading ? "VERIFYING ENCRYPTION..." : "INITIATE LOGIN"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-[#22d3ee]/40 hover:text-[#22d3ee] text-[9px] uppercase tracking-[0.2em] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                >
                  No clearance? Request Access
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}