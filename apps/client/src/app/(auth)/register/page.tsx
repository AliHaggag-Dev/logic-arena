"use client";

import React, { useMemo, useState } from "react";
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
import { PasswordStrengthIndicator } from "../components/PasswordStrengthIndicator";
import { clearSensitiveBrowserStorage } from "../../../lib/client-security";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";

interface StatusState {
  message?: string;
  errors?: string[];
  type: "error" | "success" | "info" | "loading" | null;
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: null });
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();
  const { setSafeTimeout } = useSafeTimeout();

  React.useEffect(() => {
    clearSensitiveBrowserStorage();
  }, [router]);

  const checks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }), [password]);

  const score = Object.values(checks).filter(Boolean).length;
  const isEmpty = password.length === 0;
  const strengthLabel = isEmpty ? "REQUIRED" : score <= 1 ? "WEAK" : score <= 3 ? "FAIR" : score === 4 ? "STRONG" : "MAX_SEC";
  const strengthColor = isEmpty ? "var(--text-secondary)" : score <= 1 ? "rgb(248,113,113)" : score <= 3 ? "rgb(251,191,36)" : "var(--accent)";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (score < 5) {
      setStatus({ errors: ["Please complete all password requirements before continuing."], type: "error" });
      return;
    }

    setIsLoading(true);
    setStatus({ message: "Creating your account...", type: "loading" });

    try {
      await apiClient.post("/auth/register", { email, username: username.trim(), password });
      setStatus({ message: "Account created! Sending you to email verification...", type: "success" });
      setSafeTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(email)}`), 1500);
    } catch (error: unknown) {
      const parsed = parseApiErrorFull(error);
      if (parsed.kind === "redirect") {
        // Account created but email failed — still redirect to verify-email
        setStatus({ message: parsed.message, type: "info" });
        setSafeTimeout(() => router.push(`${parsed.to}?email=${encodeURIComponent(email)}`), 2500);
      } else {
        setStatus({ errors: parsed.messages, type: "error" });
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContainer isMobile={isMobile}>
      <AuthHeader isMobile={isMobile} subtitle="Create your account" />
      <AuthSocials isMobile={isMobile} />

      <form onSubmit={handleRegister} className="flex flex-col gap-5" noValidate>
        <AuthInput
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Choose a username"
          required
          disabled={isLoading}
          autoComplete="username"
          autoFocus
        />

        <AuthInput
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <AuthInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Create a strong password"
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          <PasswordStrengthIndicator
            score={score}
            checks={checks}
            strengthColor={strengthColor}
            strengthLabel={strengthLabel}
            isMobile={isMobile}
          />
        </div>

        <AuthStatusMessage status={status} />

        <AuthButton isLoading={isLoading} loadingText="Creating account...">
          Create Account
        </AuthButton>

        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="cursor-pointer text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Already have an account? <span className="text-accent font-semibold">Sign in</span>
          </button>
          <div className="w-full h-px" style={{ background: 'rgba(var(--accent-rgb),0.08)' }} />
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer text-xs text-text-secondary/50 hover:text-text-secondary transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </form>
    </AuthContainer>
  );
}