"use client";

import React, { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { parseApiErrorFull } from "../utils/parseApiError";
import { AuthContainer } from "../components/AuthContainer";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";
import { AuthStatusMessage } from "../components/AuthStatusMessage";
import { AuthLoadingFallback } from "../components/AuthLoadingFallback";
import { ShieldCheck, ArrowLeft } from "lucide-react";

interface StatusState {
  message?: string;
  errors?: string[];
  type: "error" | "success" | "info" | "loading" | null;
}

const REQUIREMENTS: { key: string; label: string; test: (pw: string) => boolean }[] = [
  { key: "minLength",  label: "At least 8 characters",              test: (pw: string) => pw.length >= 8 },
  { key: "hasUppercase", label: "One uppercase letter",              test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "hasLowercase", label: "One lowercase letter",              test: (pw: string) => /[a-z]/.test(pw) },
  { key: "hasNumber",  label: "One number",                         test: (pw: string) => /[0-9]/.test(pw) },
  { key: "hasSpecialChar", label: "One special character",          test: (pw: string) => /[^a-zA-Z0-9]/.test(pw) },
];

function ResetPasswordContent() {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setSafeTimeout } = useSafeTimeout();

  const nextRequirement = useMemo(() => {
    if (!newPassword) return "";
    const unmet = REQUIREMENTS.find((r) => !r.test(newPassword));
    return unmet ? unmet.label : "";
  }, [newPassword]);

  const isPasswordValid = useMemo(
    () => REQUIREMENTS.every((r) => r.test(newPassword)),
    [newPassword],
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setStatus({ errors: [nextRequirement || "Finish all password requirements"], type: "error" });
      return;
    }

    setIsLoading(true);
    setStatus({ message: "Updating your password...", type: "loading" });

    try {
      await apiClient.post("/auth/reset-password", { email, code, newPassword });
      setStatus({ message: "Password updated successfully! Taking you to sign in...", type: "success" });
      setSafeTimeout(() => router.push("/login"), 1500);
    } catch (error: unknown) {
      const parsed = parseApiErrorFull(error);
      if (parsed.kind === "redirect") {
        setStatus({ message: parsed.message, type: "info" });
      } else {
        setStatus({ errors: parsed.messages, type: "error" });
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer isMobile={isMobile}>
      {/* Header */}
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
          style={{
            background: 'rgba(var(--accent-rgb),0.1)',
            border: '1px solid rgba(var(--accent-rgb),0.2)',
            boxShadow: '0 0 20px rgba(var(--accent-rgb),0.1)',
          }}
        >
          <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h1
            className="font-black tracking-[0.1em] uppercase text-accent"
            style={{ fontSize: isMobile ? 22 : 26 }}
          >
            New Password
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {email ? `Enter the code sent to ${email.split("@")[0]}***@${email.split("@")[1]}` : "Enter the code from your email"}
          </p>
        </div>
      </div>

      <form onSubmit={handleReset} className="flex flex-col gap-5" noValidate>
        {/* OTP Code input - large centered style */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-xs font-semibold tracking-wide text-text-secondary">
            6-digit reset code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
            maxLength={6}
            disabled={isLoading}
            autoComplete="one-time-code"
            autoFocus
            className="w-full rounded-xl text-3xl font-black text-center tracking-[0.5em] text-text-primary placeholder:text-text-secondary/20 outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'rgba(var(--accent-rgb),0.04)',
              border: '1px solid rgba(var(--accent-rgb),0.15)',
              padding: '16px',
              letterSpacing: '0.4em',
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <AuthInput
            id="newPassword"
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Create a new password"
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          {nextRequirement && (
            <p className="text-xs" style={{ color: 'var(--sem-warning)' }}>
              {nextRequirement}
            </p>
          )}
        </div>

        <AuthStatusMessage status={status} />

        <AuthButton isLoading={isLoading} loadingText="Updating password...">
          Set New Password
        </AuthButton>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="cursor-pointer flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mx-auto"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </button>
      </form>
    </AuthContainer>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback label="Loading..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
