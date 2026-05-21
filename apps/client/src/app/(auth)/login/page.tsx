"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { parseApiErrorFull } from "../utils/parseApiError";
import { AuthContainer } from "../components/AuthContainer";
import { AuthHeader } from "../components/AuthHeader";
import { AuthSocials } from "../components/AuthSocials";
import { AuthStatusMessage } from "../components/AuthStatusMessage";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";
import { clearSensitiveBrowserStorage, setAuthSession } from "../../../lib/client-security";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";

interface StatusState {
  message?: string;
  errors?: string[];
  type: "error" | "success" | "info" | "loading" | null;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: null });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setSafeTimeout } = useSafeTimeout();

  React.useEffect(() => {
    clearSensitiveBrowserStorage();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "Signing you in...", type: "loading" });

    try {
      const response = await apiClient.post("/auth/login", { username, password });
      const { userId, username: returnedUsername } = response.data as { userId: string; username: string };

      clearSensitiveBrowserStorage();
      setAuthSession({ userId, username: returnedUsername || username });

      setStatus({ message: "Welcome back! Taking you to your dashboard...", type: "success" });
      setSafeTimeout(() => router.push("/dashboard"), 1200);
    } catch (error: unknown) {
      const parsed = parseApiErrorFull(error);
      if (parsed.kind === "redirect") {
        // "Please verify your email first" — redirect to verify-email
        setStatus({ message: parsed.message, type: "info" });
        setSafeTimeout(() => router.push(`${parsed.to}?email=${encodeURIComponent(username)}`), 2000);
      } else {
        setStatus({ errors: parsed.messages, type: "error" });
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer isMobile={isMobile}>
      <AuthHeader isMobile={isMobile} subtitle="Sign in to your account" />
      <AuthSocials isMobile={isMobile} />

      <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
        <AuthInput
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Your username"
          required
          disabled={isLoading}
          autoComplete="username"
          autoFocus
        />

        <AuthInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <AuthStatusMessage status={status} />

        <AuthButton isLoading={isLoading} loadingText="Signing in...">
          Sign In
        </AuthButton>

        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Don&apos;t have an account? <span className="text-accent font-semibold">Create one</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-sm transition-colors"
            style={{ color: 'rgba(252,165,165,0.7)' }}
            onMouseEnter={(e) => { (e.currentTarget).style.color = 'rgb(252,165,165)'; }}
            onMouseLeave={(e) => { (e.currentTarget).style.color = 'rgba(252,165,165,0.7)'; }}
          >
            Forgot your password?
          </button>
          <div className="w-full h-px" style={{ background: 'rgba(var(--accent-rgb),0.08)' }} />
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-xs text-text-secondary/50 hover:text-text-secondary transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </form>
    </AuthContainer>
  );
}