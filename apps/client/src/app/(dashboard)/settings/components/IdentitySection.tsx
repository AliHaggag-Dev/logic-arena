"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../../../lib/api-client";
import { FeedbackState, SectionHeader, SettingsInput, SaveButton } from "./Shared";

export function IdentitySection({ isGuest = false }: { isGuest?: boolean }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("?");
  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasGithub, setHasGithub] = useState(false);

  const [usernameFb, setUsernameFb] = useState<FeedbackState>({ status: "idle" });
  const [emailFb, setEmailFb] = useState<FeedbackState>({ status: "idle" });
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") ?? "";
    setUsername(storedUsername);
    setInitials(storedUsername?.[0]?.toUpperCase() ?? "?");

    apiClient.get("/users/profile").then((res) => {
      setEmail(res.data.email ?? "");
      setHasGoogle(res.data.hasGoogle ?? false);
      setHasGithub(res.data.hasGithub ?? false);
      setUsername(res.data.username ?? storedUsername);
      setInitials((res.data.username ?? storedUsername)?.[0]?.toUpperCase() ?? "?");
    }).catch(() => { });
  }, []);

  const flash = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<FeedbackState>>,
      status: "success" | "error",
      message?: string
    ) => {
      setter({ status, message });
      setTimeout(() => setter({ status: "idle" }), 2500);
    },
    []
  );

  const saveUsername = async () => {
    if (isGuest) {
      return;
    }
    setLoadingUsername(true);
    try {
      await apiClient.put("/users/identity", { username });
      localStorage.setItem("username", username);
      setInitials(username[0]?.toUpperCase() ?? "?");
      flash(setUsernameFb, "success");
    } catch (e: any) {
      flash(setUsernameFb, "error", e?.response?.data?.message ?? "FAILED");
    } finally { setLoadingUsername(false); }
  };

  const saveEmail = async () => {
    if (isGuest) {
      return;
    }
    setLoadingEmail(true);
    try {
      await apiClient.put("/users/identity", { email });
      flash(setEmailFb, "success");
    } catch (e: any) {
      flash(setEmailFb, "error", e?.response?.data?.message ?? "FAILED");
    } finally { setLoadingEmail(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>MY PROFILE</SectionHeader>

      {/* Avatar */}
      <div className="flex items-center gap-4 p-4 bg-accent/[0.03] border border-accent/[0.08] rounded-xl">
        <div className="w-14 h-14 rounded-full bg-accent/15 border-2 border-accent/40 flex items-center justify-center text-[22px] font-black text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-[9px] tracking-[0.22em] text-accent/70 font-bold uppercase mb-0.5">Avatar Initial</div>
          <div className="text-[11px] text-text-secondary tracking-[0.1em]">
            Derived from your display name — updates automatically.
          </div>
        </div>
      </div>

      {/* Display name */}
      <div className="flex flex-col gap-3">
        <SettingsInput label="Display Name" value={username} onChange={setUsername} placeholder="Enter username" disabled={isGuest} isGuest={isGuest} />
        <SaveButton onClick={saveUsername} loading={loadingUsername} feedback={usernameFb} isGuest={isGuest} />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-3">
        <SettingsInput label="Email Address" value={email} onChange={setEmail} type="email" placeholder="Enter email" disabled={isGuest} isGuest={isGuest} />
        <SaveButton onClick={saveEmail} loading={loadingEmail} feedback={emailFb} isGuest={isGuest} />
      </div>

      {/* Connected accounts */}
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
    </div>
  );
}
