"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { parseApiErrorFull } from "../utils/parseApiError";
import { AuthContainer } from "../components/AuthContainer";
import { AuthButton } from "../components/AuthButton";
import { AuthStatusMessage } from "../components/AuthStatusMessage";
import { AuthLoadingFallback } from "../components/AuthLoadingFallback";
import { MailCheck, RotateCcw } from "lucide-react";

interface StatusState {
  message?: string;
  errors?: string[];
  type: "error" | "success" | "info" | "loading" | null;
}

function VerifyEmailContent() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setSafeTimeout } = useSafeTimeout();

  const [emailUser, emailDomain] = email.split("@");
  const maskedEmail = emailDomain ? `${emailUser?.[0] ?? ""}***@${emailDomain}` : "your email";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "Verifying your code...", type: "loading" });

    try {
      await apiClient.post("/auth/verify-email", { email, code });
      setStatus({ message: "Email verified! Taking you to sign in...", type: "success" });
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
          <MailCheck className="w-6 h-6 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h1
            className="font-black tracking-[0.1em] uppercase text-accent"
            style={{ fontSize: isMobile ? 22 : 26 }}
          >
            Verify Email
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            We sent a 6-digit code to <span className="text-text-primary font-medium">{maskedEmail}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-6" noValidate>
        {/* Large OTP input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="verifyCode" className="text-xs font-semibold tracking-wide text-text-secondary text-center">
            Enter your verification code
          </label>
          <input
            id="verifyCode"
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
            className="w-full rounded-xl font-black text-center text-text-primary placeholder:text-text-secondary/20 outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              fontSize: isMobile ? 36 : 44,
              letterSpacing: '0.4em',
              background: 'rgba(var(--accent-rgb),0.04)',
              border: '1px solid rgba(var(--accent-rgb),0.2)',
              padding: isMobile ? '20px 16px' : '24px 16px',
              boxShadow: '0 0 30px rgba(var(--accent-rgb),0.05)',
            }}
          />
          <p className="text-center text-xs text-text-secondary/50">
            Code expires in 15 minutes
          </p>
        </div>

        <AuthStatusMessage status={status} />

        <AuthButton isLoading={isLoading} loadingText="Verifying...">
          Verify Email
        </AuthButton>

        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mx-auto"
        >
          <RotateCcw size={13} />
          Didn&apos;t receive a code?
        </button>
      </form>
    </AuthContainer>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback label="Loading..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
