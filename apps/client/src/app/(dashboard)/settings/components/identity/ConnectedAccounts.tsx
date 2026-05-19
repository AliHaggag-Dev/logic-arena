"use client";

import React from "react";

interface Props {
  hasGoogle: boolean;
  hasGithub: boolean;
}

export function ConnectedAccounts({ hasGoogle, hasGithub }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">
        Connected Accounts
      </div>
      <div className="flex flex-col gap-2">
        {[
          { label: "Google", connected: hasGoogle },
          { label: "GitHub", connected: hasGithub },
        ].map(({ label, connected }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3 bg-bg-secondary border border-accent/10 rounded-lg"
          >
            <span className="text-[11px] font-bold tracking-[0.12em] text-text-secondary">{label}</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]" : "bg-text-secondary/20"}`} />
              <span className={`text-[9px] tracking-[0.2em] font-bold ${connected ? "text-green-400" : "text-text-secondary/40"}`}>
                {connected ? "LINKED" : "NOT LINKED"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
