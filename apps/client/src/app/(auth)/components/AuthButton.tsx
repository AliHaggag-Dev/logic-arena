import React from "react";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  variant?: "primary" | "danger";
  className?: string;
}

export function AuthButton({
  children,
  isLoading,
  loadingText,
  disabled,
  type = "submit",
  onClick,
  variant = "primary",
  className = "",
}: Props) {
  const isDanger = variant === "danger";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${className}`}
      style={{
        background: isDanger
          ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))'
          : 'linear-gradient(135deg, rgba(var(--accent-rgb),0.9), rgba(var(--accent-rgb),0.7))',
        border: isDanger
          ? '1px solid rgba(239,68,68,0.4)'
          : '1px solid rgba(var(--accent-rgb),0.4)',
        color: 'var(--bg-primary)',
        boxShadow: isDanger
          ? '0 4px 20px rgba(239,68,68,0.2)'
          : '0 4px 20px rgba(var(--accent-rgb),0.25)',
        opacity: (disabled || isLoading) ? 0.6 : 1,
        cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = isDanger
            ? '0 8px 30px rgba(239,68,68,0.35)'
            : '0 8px 30px rgba(var(--accent-rgb),0.4)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = isDanger
          ? '0 4px 20px rgba(239,68,68,0.2)'
          : '0 4px 20px rgba(var(--accent-rgb),0.25)';
      }}
    >
      {isLoading && <Loader2 size={15} className="animate-spin" />}
      {isLoading ? (loadingText ?? "Please wait...") : children}
    </button>
  );
}
