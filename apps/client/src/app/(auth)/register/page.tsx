"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

// ---------------------------------------------------------------------------
// Extracts clean, human-readable messages from both our ZodValidationPipe
// ({ messages: string[] }) and NestJS built-in exceptions ({ message: string }).
// ---------------------------------------------------------------------------
function parseApiError(error: any): string[] {
  const data = error?.response?.data;
  if (!data) return [error?.message ?? "An unexpected error occurred"];
  // ZodValidationPipe returns { messages: string[] }
  if (Array.isArray(data.messages) && data.messages.length > 0) return data.messages;
  // NestJS built-ins return { message: string | string[] }
  if (Array.isArray(data.message)) return data.message as string[];
  if (typeof data.message === "string") return [data.message];
  return [error?.message ?? "An unexpected error occurred"];
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    errors:  string[];
    type: "error" | "success" | null;
  }>({ message: "", errors: [], type: null });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // ── Password strength ────────────────────────────────────────────────────
  const checks = useMemo(() => ({
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }), [password]);

  const score = Object.values(checks).filter(Boolean).length;
  const strengthLabel = score <= 1 ? "WEAK" : score <= 3 ? "FAIR" : score === 4 ? "STRONG" : "MAX_SEC";
  const strengthColor = score <= 1 ? "#ef4444" : score <= 3 ? "#f59e0b" : score === 4 ? "#22c55e" : "#22d3ee";

  // ── Handler ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "INITIALIZING UPLINK...", errors: [], type: null });

    try {
      await apiClient.post("/auth/register", { email, username, password });
      setStatus({ message: "[SYS] REGISTRATION SUCCESSFUL. REROUTING...", errors: [], type: "success" });
      setTimeout(() => router.push("/login"), 1500);

    } catch (error: any) {
      const errs = parseApiError(error);
      console.error("Registration failed:", errs);
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
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent animate-[scanline_8s_linear_infinite]" />
        </div>

        <div className="w-full max-w-[420px] bg-black/60 backdrop-blur-xl border border-[#a855f7]/20 rounded-xl p-8 relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(168,85,247,0.05)] animate-[fadeInScale_0.4s_ease-out]">
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#a855f7]/60 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#a855f7]/60 rounded-br-xl" />
          
          <div className="absolute top-3 right-4 text-[8px] text-[#a855f7]/30 tracking-[0.2em] pointer-events-none">SECURE_NODE_V1</div>

          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-10 h-10 mb-4 border border-[#a855f7]/30 rounded-full flex items-center justify-center bg-[#a855f7]/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <span className="text-[#a855f7] shadow-[#a855f7]">◈</span>
            </div>
            <h1 className="text-[#22d3ee] font-black text-3xl tracking-[0.2em] drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] mb-2">
              LOGIC ARENA
            </h1>
            <h2 className="text-[#a855f7]/70 text-[10px] tracking-[0.3em] uppercase">
              [ Initialize Operator ID ]
            </h2>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[9px] text-[#22d3ee]/60 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="username">
                Operator Name
              </label>
              <input
                type="text"
                id="username"
                className="w-full bg-[#030712]/80 border border-[#a855f7]/20 rounded-lg p-3.5 text-[#22d3ee] outline-none focus:border-[#a855f7]/60 focus:bg-[#a855f7]/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder-[#22d3ee]/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                placeholder="Enter designated alias"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[9px] text-[#22d3ee]/60 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="email">
                Comms Link (Email)
              </label>
              <input
                type="email"
                id="email"
                className="w-full bg-[#030712]/80 border border-[#a855f7]/20 rounded-lg p-3.5 text-[#22d3ee] outline-none focus:border-[#a855f7]/60 focus:bg-[#a855f7]/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder-[#22d3ee]/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                placeholder="operator@network.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[9px] text-[#22d3ee]/60 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="password">
                Security Key
              </label>
              <input
                type="password"
                id="password"
                className="w-full bg-[#030712]/80 border border-[#a855f7]/20 rounded-lg p-3.5 text-[#22d3ee] outline-none focus:border-[#a855f7]/60 focus:bg-[#a855f7]/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder-[#22d3ee]/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              {/* ── Password Strength Indicator ── */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2 px-0.5">
                  {/* Strength bars + label */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] text-[#a855f7]/40 tracking-widest uppercase shrink-0">Strength</span>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-[2px] rounded-full transition-all duration-300"
                        style={{
                          background: i <= score ? strengthColor : "rgba(168,85,247,0.12)",
                          boxShadow:  i <= score ? `0 0 5px ${strengthColor}80` : "none",
                        }}
                      />
                    ))}
                    <span
                      className="text-[7px] font-black tracking-widest shrink-0 transition-colors duration-300"
                      style={{ color: strengthColor }}
                    >
                      {strengthLabel}
                    </span>
                  </div>

                  {/* Per-rule checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {([
                      { ok: checks.length,  label: "8+ characters" },
                      { ok: checks.upper,   label: "Uppercase letter" },
                      { ok: checks.lower,   label: "Lowercase letter" },
                      { ok: checks.number,  label: "Number" },
                      { ok: checks.special, label: "Special character" },
                    ] as { ok: boolean; label: string }[]).map(({ ok, label }) => (
                      <span
                        key={label}
                        className="text-[7px] tracking-wider transition-colors duration-200"
                        style={{ color: ok ? "#22c55e" : "rgba(168,85,247,0.3)" }}
                      >
                        {ok ? "✓" : "✗"} {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── In-UI Status Terminal ── */}
            <div className="min-h-[40px] flex items-start justify-center">
              {/* Loading / success single-line message */}
              {status.message && (
                <div className={`w-full p-2.5 rounded-md border text-[9px] tracking-[0.1em] text-center font-bold break-words transition-all ${
                  status.type === "success"
                    ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                    : "bg-[#a855f7]/10 border-[#a855f7]/40 text-[#a855f7] animate-pulse"
                }`}>
                  {status.message}
                </div>
              )}

              {/* Validation error list (one chip per error) */}
              {status.errors.length > 0 && (
                <div className="w-full p-2.5 rounded-md border bg-[#ef4444]/10 border-[#ef4444]/40 shadow-[0_0_10px_rgba(239,68,68,0.15)] space-y-1">
                  {status.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[9px] tracking-[0.08em] font-bold text-[#ef4444] break-words">
                      <span className="shrink-0 mt-px opacity-70">›</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#a855f7]/10 border border-[#a855f7]/40 text-[#a855f7] font-black text-[11px] hover:bg-[#a855f7]/20 hover:border-[#a855f7]/80 transition-all duration-300 rounded-lg uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed group"
              >
                {isLoading ? "PROCESSING..." : "REGISTER PROTOCOL"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-[#22d3ee]/40 hover:text-[#22d3ee] text-[9px] uppercase tracking-[0.2em] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                >
                  Already registered? Establish Link
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}