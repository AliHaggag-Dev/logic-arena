"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { parseApiError } from "../utils/parseApiError";
import { AuthContainer } from "../components/AuthContainer";
import { AuthHeader } from "../components/AuthHeader";
import { AuthSocials } from "../components/AuthSocials";
import { AuthStatusTerminal } from "../components/AuthStatusTerminal";

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
      setStatus({ message: "", errors: errs, type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer isMobile={isMobile} nodeName="AUTH_NODE_V2.1">
      <AuthHeader isMobile={isMobile} subtitle={isMobile ? "SYNC_OP" : "Authenticate Operator"} icon="⬡" />
      <AuthSocials isMobile={isMobile} />

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] text-accent/50 uppercase tracking-[0.25em] font-black ml-1" htmlFor="username">
            // OPERATOR_ID
          </label>
          <input
            type="text"
            id="username"
            className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-60 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
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
            className={`w-full bg-bg-primary/80 border border-accent/20 rounded-lg ${isMobile ? "p-4" : "p-3.5"} text-accent outline-none focus:border-accent/60 focus:bg-accent/5 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] text-xs placeholder:opacity-60 focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]`}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <AuthStatusTerminal status={status} />

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
              className="text-accent/70 hover:text-accent text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
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
    </AuthContainer>
  );
}