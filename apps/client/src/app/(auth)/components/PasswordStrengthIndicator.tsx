import React from "react";
import { Check, X } from "lucide-react";

interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

interface Props {
  score: number;
  checks: PasswordChecks;
  strengthColor: string;
  strengthLabel: string;
  isMobile: boolean;
}

const STRENGTH_LABELS: Record<string, string> = {
  WEAK: "Weak",
  FAIR: "Fair",
  STRONG: "Good",
  MAX_SEC: "Strong",
};

const RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: "length",  label: "At least 8 characters" },
  { key: "upper",   label: "One uppercase letter" },
  { key: "lower",   label: "One lowercase letter" },
  { key: "number",  label: "One number" },
  { key: "special", label: "One special character" },
];

export function PasswordStrengthIndicator({ score, checks, strengthColor, strengthLabel }: Props) {
  const label = STRENGTH_LABELS[strengthLabel] ?? strengthLabel;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i <= score ? strengthColor : 'rgba(var(--accent-rgb),0.08)',
                boxShadow: i <= score ? `0 0 6px ${strengthColor}60` : 'none',
              }}
            />
          ))}
        </div>
        <span
          className="text-xs font-semibold min-w-[44px] text-right transition-colors duration-300"
          style={{ color: strengthColor }}
        >
          {label}
        </span>
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-1 gap-1.5">
        {RULES.map(({ key, label: ruleLabel }) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                background: checks[key] ? 'rgba(34,197,94,0.15)' : 'rgba(var(--accent-rgb),0.05)',
                border: checks[key] ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(var(--accent-rgb),0.1)',
              }}
            >
              {checks[key]
                ? <Check size={9} style={{ color: 'rgb(134,239,172)' }} />
                : <X size={9} className="text-text-secondary opacity-30" />}
            </div>
            <span
              className="text-xs transition-colors duration-200"
              style={{ color: checks[key] ? 'rgb(134,239,172)' : 'var(--text-secondary)' }}
            >
              {ruleLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
