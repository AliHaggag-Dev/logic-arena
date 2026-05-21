"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { parseApiErrorFull } from "../utils/parseApiError";
import { AuthContainer } from "../components/AuthContainer";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";
import { AuthStatusMessage } from "../components/AuthStatusMessage";
import { KeyRound, ArrowLeft } from "lucide-react";

interface StatusState {
  message?: string;
  errors?: string[];
  type: "error" | "success" | "info" | "loading" | null;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<StatusState>({ type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setSafeTimeout } = useSafeTimeout();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "Sending reset code to your email...", type: "loading" });

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus({ message: "Reset code sent! Check your inbox and enter the 6-digit code.", type: "success" });
      setSafeTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1800);
    } catch (error: unknown) {
      const parsed = parseApiErrorFull(error);
      if (parsed.kind === "redirect") {
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
      {/* Header */}
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
          style={{
            background: 'rgba(252,165,165,0.1)',
            border: '1px solid rgba(252,165,165,0.2)',
            boxShadow: '0 0 20px rgba(239,68,68,0.1)',
          }}
        >
          <KeyRound className="w-6 h-6" style={{ color: 'rgb(252,165,165)' }} aria-hidden="true" />
        </div>
        <div>
          <h1
            className="font-black tracking-[0.1em] uppercase"
            style={{ fontSize: isMobile ? 22 : 26, color: 'rgb(252,165,165)' }}
          >
            Reset Password
          </h1>
          <p className="text-text-secondary text-sm mt-1">Enter your email to receive a reset code</p>
        </div>
      </div>

      <form onSubmit={handleForgot} className="flex flex-col gap-5" noValidate>
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
          autoFocus
        />

        <AuthStatusMessage status={status} />

        <AuthButton isLoading={isLoading} loadingText="Sending..." variant="danger">
          Send Reset Code
        </AuthButton>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mx-auto"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </button>
      </form>
    </AuthContainer>
  );
}
