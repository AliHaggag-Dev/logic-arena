"use client";

import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface VaultToastProps {
  message: string;
  type: "success" | "error";
}

export function VaultToast({ message, type }: VaultToastProps) {
  return (
    <div
      className={`
        fixed bottom-28 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-2.5 px-5 py-3 rounded-2xl
        border backdrop-blur-xl font-mono text-[10px] tracking-[0.18em] font-bold
        shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        animate-[toastIn_0.3s_ease]
        ${
          type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }
      `}
    >
      {type === "success" ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      )}
      {message}
    </div>
  );
}
