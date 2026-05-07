"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { parseApiError } from "../utils/parseApiError";
import { AuthContainer } from "../components/AuthContainer";
import { AuthHeader } from "../components/AuthHeader";
import { AuthSocials } from "../components/AuthSocials";
import { AuthStatusTerminal } from "../components/AuthStatusTerminal";
import { clearSensitiveBrowserStorage } from "../../../lib/client-security";
import { PasswordStrengthIndicator } from "../components/PasswordStrengthIndicator";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    errors: string[];
    type: "error" | "success" | null;
  }>({ message: "", errors: [], type: null });
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();
  const { setSafeTimeout } = useSafeTimeout();

  React.useEffect(() => {
    clearSensitiveBrowserStorage();
  }, [router]);

  // ── Password strength ────────────────────────────────────────────────────
  const checks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }), [password]);

  const score = Object.values(checks).filter(Boolean).length;
  const strengthLabel = score <= 1 ? "WEAK" : score <= 3 ? "FAIR" : score === 4 ? "STRONG" : "MAX_SEC";
  const strengthColor = score <= 1 ? "var(--color-red-500)" : score <= 3 ? "#f59e0b" : score === 4 ? "var(--accent)" : "var(--accent)";

  // ── Handler ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "INITIALIZING UPLINK...", errors: [], type: null });

    try {
      await apiClient.post("/auth/register", { email, username, password });
      setStatus({ message: "ACCOUNT CREATED SUCCESSFULLY. REDIRECTING...", errors: [], type: "success" });
      setSafeTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(email)}`), 1500);
    } catch (error: any) {
      const errs = parseApiError(error);
      setStatus({ message: "", errors: errs, type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer isMobile={isMobile} nodeName="// v2.1">
      <AuthHeader isMobile={isMobile} subtitle={isMobile ? "REGISTER" : "Sign Up"} icon="◈" />
      <AuthSocials isMobile={isMobile} />

      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] text-accent/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="username">
            // USERNAME
          </label>
          <input
            type="text"
            id="username"
            className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-60 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
            placeholder="ENTER USERNAME..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] text-accent/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="email">
            // EMAIL ADDRESS
          </label>
          <input
            type="email"
            id="email"
            className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-60 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
            placeholder="ENTER EMAIL ADDRESS..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] text-accent/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="password">
            // PASSWORD
          </label>
          <input
            type="password"
            id="password"
            className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-60 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {password.length > 0 && (
            <PasswordStrengthIndicator
              score={score}
              checks={checks}
              strengthColor={strengthColor}
              strengthLabel={strengthLabel}
              isMobile={isMobile}
            />
          )}
        </div>

        <AuthStatusTerminal status={status} />

        <div className="flex flex-col gap-4 mt-1">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isMobile ? "py-5" : "py-4"} bg-accent/10 border border-accent/40 text-accent font-black text-[11px] hover:bg-accent/20 hover:border-accent/80 transition-all duration-300 rounded-lg uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.3)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed`}
          >
            {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>

          <div className="text-center flex flex-col gap-4">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-green-500 hover:text-green-600 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
            >
              [ Log In instead ]
            </button>
            <button
              type="button"
              onClick={() => router.push("/verify-email")}
              className="text-accent/30 hover:text-accent/60 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300"
            >
              [ Verify Email Code ]
            </button>
            <div className="mt-2 pt-2 border-t border-accent/10 w-full max-w-[200px] mx-auto">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-accent/40 hover:text-accent/80 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]"
              >
                [ Continue as Guest ]
              </button>
            </div>
          </div>
        </div>
      </form>
    </AuthContainer>
  );
}