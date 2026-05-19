"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { AuthContainer } from "../components/AuthContainer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success" | null;
  }>({ message: "", type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setSafeTimeout } = useSafeTimeout();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "SENDING RESET LINK...", type: null });

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus({
        message: "RESET LINK SENT. PLEASE CHECK YOUR EMAIL.",
        type: "success"
      });
      setSafeTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1500);
    } catch (err: any) {
      setStatus({
        message: `ERROR: ${err.response?.data?.message || err.message}`,
        type: "error"
      });
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer isMobile={isMobile} nodeName="v1.0" variant="danger">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="w-10 h-10 mb-4 border border-red-500/30 rounded-full flex items-center justify-center bg-red-500/5 shadow-[0_0_15px_rgba(var(--color-red-500),0.15)]">
          <span className="text-red-500 shadow-red">{'\u26A0'}</span>
        </div>
        <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} text-red-500 font-black tracking-[0.2em] drop-shadow-[0_0_10px_rgba(var(--color-red-500),0.6)] mb-2 uppercase`}>
          RESET PASSWORD
        </h1>
        <h2 className="text-red-500/60 text-[10px] tracking-[0.3em] uppercase">
          Enter your email to reset
        </h2>
      </div>

      <form onSubmit={handleForgot} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] text-red-500/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="email">
            // EMAIL ADDRESS
          </label>
          <input
            type="email"
            id="email"
            className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-60 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
            placeholder="EMAIL@NETWORK.LOCAL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

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

        <div className="flex flex-col gap-5 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isMobile ? "py-5" : "py-4"} bg-red-500/10 border border-red-500/40 text-red-500 font-black text-[11px] hover:bg-red-500/20 hover:border-red-500/80 transition-all duration-300 rounded-lg uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(var(--color-red-500),0.1)] hover:shadow-[0_0_25px_rgba(var(--color-red-500),0.3)] hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:translate-y-0`}
          >
            {isLoading ? "SENDING..." : "SEND RESET LINK"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-accent/40 hover:text-accent text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
          >
            [ Back to Login ]
          </button>
        </div>
      </form>
    </AuthContainer>
  );
}
