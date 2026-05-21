import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  minLength?: number;
  maxLength?: number;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}

export function AuthInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  autoComplete,
  autoFocus,
  minLength,
  maxLength,
  inputMode,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide"
        style={{ color: focused ? 'var(--accent)' : 'var(--text-secondary)', transition: 'color 0.2s' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-xl text-sm text-text-primary placeholder:text-text-secondary/40 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: focused
              ? 'color-mix(in srgb, var(--accent) 5%, transparent)'
              : 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
            border: focused
              ? '1px solid rgba(var(--accent-rgb),0.5)'
              : '1px solid color-mix(in srgb, var(--text-primary) 15%, transparent)',
            boxShadow: focused ? '0 0 0 3px rgba(var(--accent-rgb),0.08), inset 0 2px 8px rgba(0,0,0,0.05)' : 'inset 0 2px 8px rgba(0,0,0,0.05)',
            padding: isPassword ? '12px 44px 12px 16px' : '12px 16px',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
