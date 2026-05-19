"use client";

import React from "react";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { FeedbackState } from "./types";

export function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  isGuest,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password" | "number" | "tel";
  placeholder?: string;
  disabled?: boolean;
  isGuest?: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isDisabledOrGuest = disabled || isGuest;
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">
        {label} {isGuest && "(GUEST LOCKED)"}
      </label>
      <div className="relative">
        <input
          type={actualType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabledOrGuest}
          readOnly={isDisabledOrGuest}
          className={`w-full bg-bg-secondary border border-accent/10 rounded-lg px-4 py-3 text-text-primary focus:border-accent/70 focus:outline-none focus:ring-1 focus:ring-accent/70 transition-colors font-mono text-[12px] placeholder:text-text-secondary/40 ${isDisabledOrGuest ? "opacity-50 cursor-not-allowed" : ""
            } ${isGuest ? "border-dashed" : ""} ${isPassword ? "pr-12" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isDisabledOrGuest}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-accent/50 hover:text-accent transition-colors ${isDisabledOrGuest ? "opacity-50 cursor-not-allowed cursor-pointer" : "cursor-pointer"}`}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SaveButton({
  onClick,
  loading,
  feedback,
  label = "SAVE CHANGES",
  disabled,
  isGuest,
}: {
  onClick: () => void;
  loading: boolean;
  feedback: FeedbackState;
  label?: string;
  disabled?: boolean;
  isGuest?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => !isGuest && onClick()}
        disabled={loading || isGuest || disabled}
        className={`rounded-lg px-6 py-2 text-[10px] tracking-widest font-bold font-mono transition-all duration-150 ${loading ? "opacity-50 cursor-wait" : (isGuest || disabled) ? "cursor-not-allowed" : "cursor-pointer hover:bg-accent/20"
          } ${isGuest
            ? "bg-accent/5 border border-accent/10 text-accent/40"
            : "bg-accent/10 border border-accent/30 text-accent"
          } ${(disabled && !loading && !isGuest) ? "opacity-40" : ""}`}
      >
        {loading ? "PROCESSING..." : label}
      </button>
      {feedback.status === "success" && (
        <span className="text-[10px] text-green-400 tracking-[0.12em] animate-pulse flex items-center gap-1" aria-live="polite" role="status">
          <CheckCircle className="w-3 h-3" /> {feedback.message ?? "UPDATED"}
        </span>
      )}
      {feedback.status === "error" && (
        <span className="text-[10px] text-red-400 tracking-[0.12em] flex items-center gap-1" aria-live="polite" role="status">
          <XCircle className="w-3 h-3" /> {feedback.message ?? "ERROR"}
        </span>
      )}
    </div>
  );
}
