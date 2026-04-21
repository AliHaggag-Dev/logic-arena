"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { apiClient } from "../../../lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionId =
  | "identity"
  | "security"
  | "appearance"
  | "arena"
  | "notifications";

interface FeedbackState {
  status: "idle" | "success" | "error";
  message?: string;
}

// ── Small reusable atoms ───────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-accent/60 text-[11px] font-bold select-none">⌐</span>
      <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent">
        {children}
      </span>
      <span className="text-accent/60 text-[11px] font-bold select-none">¬</span>
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-bg-secondary border border-accent/10 rounded-lg px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors font-mono text-[12px] placeholder:text-text-secondary/40"
      />
    </div>
  );
}

function SaveButton({
  onClick,
  loading,
  feedback,
  label = "SAVE CHANGES",
}: {
  onClick: () => void;
  loading: boolean;
  feedback: FeedbackState;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={loading}
        className="bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-lg px-6 py-2 text-[10px] tracking-widest font-bold font-mono transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "PROCESSING..." : label}
      </button>
      {feedback.status === "success" && (
        <span className="text-[10px] text-green-400 tracking-[0.12em] animate-pulse">
          ✓ {feedback.message ?? "UPDATED"}
        </span>
      )}
      {feedback.status === "error" && (
        <span className="text-[10px] text-red-400 tracking-[0.12em]">
          ✗ {feedback.message ?? "ERROR"}
        </span>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label
      htmlFor={id}
      className="relative inline-flex items-center cursor-pointer min-w-[44px] min-h-[44px] justify-center"
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`w-11 h-6 rounded-full border transition-all duration-200 relative ${
          checked
            ? "bg-accent/20 border-accent/60"
            : "bg-bg-secondary border-accent/10"
        }`}
      >
        <div
          className={`absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all duration-200 ${
            checked ? "left-[22px] bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" : "left-[3px] bg-text-secondary/30"
          }`}
        />
      </div>
    </label>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

function calcStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

const STRENGTH_LABELS = ["WEAK", "POOR", "FAIR", "GOOD", "STRONG", "MAX"];
const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-400",
  "bg-green-400",
  "bg-accent",
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = calcStrength(password);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? STRENGTH_COLORS[strength] : "bg-bg-secondary border border-accent/10"
            }`}
          />
        ))}
      </div>
      <span className="text-[9px] tracking-[0.2em] text-accent/50 font-bold">
        {STRENGTH_LABELS[strength]}
      </span>
    </div>
  );
}

// ── Section: Operator Identity ─────────────────────────────────────────────────

function IdentitySection() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [initials, setInitials] = useState("?");
  const [hasGoogle, setHasGoogle]     = useState(false);
  const [hasGithub, setHasGithub]     = useState(false);

  const [usernameFb, setUsernameFb] = useState<FeedbackState>({ status: "idle" });
  const [emailFb, setEmailFb]       = useState<FeedbackState>({ status: "idle" });
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingEmail, setLoadingEmail]       = useState(false);

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
    }).catch(() => {});
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
      <SectionHeader>OPERATOR IDENTITY</SectionHeader>

      {/* Avatar */}
      <div className="flex items-center gap-4 p-4 bg-accent/[0.03] border border-accent/[0.08] rounded-xl">
        <div className="w-14 h-14 rounded-full bg-accent/15 border-2 border-accent/40 flex items-center justify-center text-[22px] font-black text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-[9px] tracking-[0.22em] text-accent/40 font-bold uppercase mb-0.5">Avatar Initial</div>
          <div className="text-[11px] text-text-secondary tracking-[0.1em]">
            Derived from your display name — updates automatically.
          </div>
        </div>
      </div>

      {/* Display name */}
      <div className="flex flex-col gap-3">
        <SettingsInput label="Display Name" value={username} onChange={setUsername} placeholder="Enter username" />
        <SaveButton onClick={saveUsername} loading={loadingUsername} feedback={usernameFb} />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-3">
        <SettingsInput label="Email Address" value={email} onChange={setEmail} type="email" placeholder="Enter email" />
        <SaveButton onClick={saveEmail} loading={loadingEmail} feedback={emailFb} />
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

// ── Section: Security Protocol ─────────────────────────────────────────────────

function SecuritySection() {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwFb,      setPwFb]      = useState<FeedbackState>({ status: "idle" });
  const [loadingPw, setLoadingPw] = useState(false);

  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [deleteConfirm,   setDeleteConfirm]       = useState("");
  const [storedUsername,  setStoredUsername]       = useState("");
  const [deleteFb,        setDeleteFb]            = useState<FeedbackState>({ status: "idle" });
  const [loadingDelete,   setLoadingDelete]        = useState(false);

  useEffect(() => {
    setStoredUsername(localStorage.getItem("username") ?? "");
  }, []);

  const flash = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<FeedbackState>>,
      status: "success" | "error",
      message?: string
    ) => {
      setter({ status, message });
      setTimeout(() => setter({ status: "idle" }), 2500);
    }, []
  );

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      return flash(setPwFb, "error", "ALL FIELDS REQUIRED");
    }
    if (newPw !== confirmPw) {
      return flash(setPwFb, "error", "PASSWORDS DO NOT MATCH");
    }
    if (newPw.length < 8) {
      return flash(setPwFb, "error", "MIN 8 CHARACTERS");
    }
    setLoadingPw(true);
    try {
      await apiClient.put("/users/password", { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      flash(setPwFb, "success", "CREDENTIALS UPDATED");
    } catch (e: any) {
      flash(setPwFb, "error", e?.response?.data?.message ?? "FAILED");
    } finally { setLoadingPw(false); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== storedUsername) {
      return flash(setDeleteFb, "error", "USERNAME MISMATCH");
    }
    setLoadingDelete(true);
    try {
      await apiClient.delete("/users/account");
      ["token","jwtToken","userId","username"].forEach((k) => localStorage.removeItem(k));
      router.push("/login");
    } catch (e: any) {
      flash(setDeleteFb, "error", e?.response?.data?.message ?? "FAILED");
      setLoadingDelete(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>SECURITY PROTOCOL</SectionHeader>

      {/* Password change */}
      <div className="flex flex-col gap-4">
        <SettingsInput label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" />
        <SettingsInput label="New Password"     value={newPw}     onChange={setNewPw}     type="password" placeholder="••••••••" />
        <PasswordStrength password={newPw} />
        <SettingsInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="••••••••" />
        <SaveButton onClick={changePassword} loading={loadingPw} feedback={pwFb} label="UPDATE CREDENTIALS" />
      </div>

      {/* Danger zone */}
      <div className="mt-4 p-5 border border-red-500/30 rounded-xl bg-red-500/[0.03] relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
          style={{ background: "rgba(239,68,68,0.6)" }}
        />
        <div className="text-[10px] font-black tracking-[0.3em] uppercase text-red-400 mb-2 ml-2">
          ⚠ DANGER ZONE
        </div>
        <p className="text-[11px] text-text-secondary/70 ml-2 mb-4 tracking-[0.05em]">
          Permanently deletes your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="ml-2 px-5 py-2 bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-500/70 rounded-lg text-[10px] font-bold tracking-[0.2em] font-mono transition-all duration-150"
        >
          TERMINATE ACCOUNT
        </button>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div
            className="bg-bg-primary border border-red-500/40 rounded-xl p-8 max-w-sm w-full mx-4 font-mono shadow-[0_0_60px_rgba(239,68,68,0.15)]"
            style={{ animation: "modalIn 0.2s ease" }}
          >
            <div className="text-[9px] tracking-[0.28em] text-red-400/50 mb-2">// CONFIRM_TERMINATION</div>
            <h3 className="text-red-400 font-black tracking-[0.15em] text-lg mb-3">TERMINATE ACCOUNT?</h3>
            <p className="text-text-secondary/70 text-[11px] tracking-[0.06em] mb-5">
              Type your username{" "}
              <span className="text-accent font-bold">{storedUsername}</span>{" "}
              to confirm permanent deletion.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="TYPE YOUR USERNAME TO CONFIRM"
              className="w-full bg-bg-secondary border border-accent/10 rounded-lg px-4 py-3 text-text-primary focus:border-red-500/60 focus:outline-none transition-colors text-[11px] font-mono mb-4 placeholder:text-text-secondary/30 placeholder:text-[9px]"
            />
            {deleteFb.status === "error" && (
              <p className="text-red-400 text-[10px] tracking-[0.1em] mb-3">✗ {deleteFb.message}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={loadingDelete}
                className="flex-1 py-2.5 text-[10px] tracking-[0.18em] font-bold border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-40"
              >
                {loadingDelete ? "TERMINATING..." : "CONFIRM DELETE"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 py-2.5 text-[10px] tracking-[0.18em] font-bold border border-accent/20 bg-accent/5 text-accent/60 hover:bg-accent/10 rounded-lg transition-all"
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section: Appearance ────────────────────────────────────────────────────────

const THEME_CARDS = [
  {
    id: "cyberpunk",
    label: "CYBERPUNK",
    palette: ["#0a0f1e", "#00e5ff", "#e2e8f0"],
    desc: "Dark neon — the default operative environment",
  },
  {
    id: "light",
    label: "LIGHT",
    palette: ["#f8fafc", "#0ea5e9", "#0f172a"],
    desc: "High-visibility tactical interface",
  },
  {
    id: "desert",
    label: "DESERT",
    palette: ["#1a1208", "#f59e0b", "#fde68a"],
    desc: "Amber warmth for extended operations",
  },
] as const;

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>APPEARANCE</SectionHeader>
      <div className="grid grid-cols-1 gap-3">
        {THEME_CARDS.map(({ id, label, palette, desc }) => {
          const isActive = theme === id;
          return (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group ${
                isActive
                  ? "border-accent bg-accent/[0.07] shadow-[0_0_20px_rgba(var(--accent-rgb),0.12),inset_0_0_30px_rgba(var(--accent-rgb),0.04)]"
                  : "border-accent/10 bg-bg-secondary hover:border-accent/30 hover:bg-accent/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-black tracking-[0.25em] ${isActive ? "text-accent [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.6)]" : "text-text-secondary group-hover:text-text-primary"} transition-colors`}>
                  {label}
                </span>
                <div className="flex gap-1.5 items-center">
                  {palette.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {isActive && (
                    <span className="ml-2 text-accent text-[10px] font-bold tracking-widest">ACTIVE</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-text-secondary/60 tracking-[0.06em]">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Section: Arena Preferences ─────────────────────────────────────────────────

function ArenaSection() {
  const [defaultRobot, setDefaultRobot] = useState("unit-01");
  const [soundFx,      setSoundFx]      = useState(true);
  const [showFps,      setShowFps]      = useState(false);

  useEffect(() => {
    setDefaultRobot(localStorage.getItem("defaultRobot") ?? "unit-01");
    setSoundFx(localStorage.getItem("soundFx") !== "false");
    setShowFps(localStorage.getItem("showFps") === "true");
  }, []);

  const save = (key: string, value: string) => localStorage.setItem(key, value);

  const ROBOTS = [
    { id: "unit-01", label: "UNIT-01", desc: "Standard assault frame" },
    { id: "unit-02", label: "UNIT-02", desc: "Heavy armor variant" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>ARENA PREFERENCES</SectionHeader>

      {/* Default Robot */}
      <div className="flex flex-col gap-3">
        <div className="text-[9px] tracking-[0.22em] text-accent/50 font-bold uppercase">Default Robot</div>
        <div className="grid grid-cols-2 gap-3">
          {ROBOTS.map(({ id, label, desc }) => {
            const selected = defaultRobot === id;
            return (
              <button
                key={id}
                onClick={() => { setDefaultRobot(id); save("defaultRobot", id); }}
                className={`p-4 rounded-xl border text-left transition-all duration-200 group ${
                  selected
                    ? "border-accent bg-accent/[0.07] shadow-[0_0_16px_rgba(var(--accent-rgb),0.10)]"
                    : "border-accent/10 bg-bg-secondary hover:border-accent/30"
                }`}
              >
                {/* Robot icon placeholder */}
                <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-2xl border ${selected ? "border-accent/40 bg-accent/10" : "border-accent/10 bg-bg-primary"}`}>
                  🤖
                </div>
                <div className={`text-[11px] font-black tracking-[0.2em] mb-1 ${selected ? "text-accent" : "text-text-secondary"}`}>{label}</div>
                <div className="text-[9px] text-text-secondary/50 tracking-[0.06em]">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-0 border border-accent/10 rounded-xl overflow-hidden">
        {[
          { id: "soundFx",  label: "Sound Effects",  sub: "In-arena audio feedback",         val: soundFx,  set: (v: boolean) => { setSoundFx(v);  save("soundFx",  String(v)); } },
          { id: "showFps",  label: "Show FPS Counter", sub: "Performance overlay during match", val: showFps, set: (v: boolean) => { setShowFps(v); save("showFps",  String(v)); } },
        ].map(({ id, label, sub, val, set }, i, arr) => (
          <div key={id} className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < arr.length - 1 ? "border-b border-accent/10" : ""}`}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
            </div>
            <Toggle id={id} checked={val} onChange={set} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Neural Notifications ─────────────────────────────────────────────

function NotificationsSection() {
  const [challengeReqs,   setChallengeReqs]   = useState(true);
  const [tournamentAlerts, setTournamentAlerts] = useState(true);
  const [matchResults,    setMatchResults]    = useState(true);

  useEffect(() => {
    setChallengeReqs(localStorage.getItem("notif_challenges")    !== "false");
    setTournamentAlerts(localStorage.getItem("notif_tournaments") !== "false");
    setMatchResults(localStorage.getItem("notif_results")        !== "false");
  }, []);

  const save = (key: string, value: boolean) =>
    localStorage.setItem(key, String(value));

  const ITEMS = [
    { id: "challenges",    label: "Challenge Requests",  sub: "Incoming combat challenges from other operators",   val: challengeReqs,    set: (v: boolean) => { setChallengeReqs(v);    save("notif_challenges",   v); } },
    { id: "tournaments",   label: "Tournament Alerts",   sub: "Updates when a tournament begins or ends",          val: tournamentAlerts,  set: (v: boolean) => { setTournamentAlerts(v); save("notif_tournaments",  v); } },
    { id: "matchResults",  label: "Match Results",       sub: "Post-match outcome notifications",                  val: matchResults,     set: (v: boolean) => { setMatchResults(v);     save("notif_results",      v); } },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>NEURAL NOTIFICATIONS</SectionHeader>
      <div className="flex flex-col border border-accent/10 rounded-xl overflow-hidden">
        {ITEMS.map(({ id, label, sub, val, set }, i) => (
          <div key={id} className={`flex items-center justify-between px-4 py-4 bg-bg-secondary ${i < ITEMS.length - 1 ? "border-b border-accent/10" : ""}`}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] text-text-primary">{label}</div>
              <div className="text-[9px] text-text-secondary/50 tracking-[0.06em] mt-0.5">{sub}</div>
            </div>
            <Toggle id={`notif_${id}`} checked={val} onChange={set} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section registry ───────────────────────────────────────────────────────────

const SECTIONS: { id: SectionId; label: string; shortLabel: string }[] = [
  { id: "identity",      label: "OPERATOR IDENTITY",      shortLabel: "IDENTITY" },
  { id: "security",      label: "SECURITY PROTOCOL",      shortLabel: "SECURITY" },
  { id: "appearance",    label: "APPEARANCE",              shortLabel: "APPEARANCE" },
  { id: "arena",         label: "ARENA PREFERENCES",       shortLabel: "ARENA" },
  { id: "notifications", label: "NEURAL NOTIFICATIONS",    shortLabel: "NOTIFS" },
];

function renderSection(id: SectionId) {
  switch (id) {
    case "identity":      return <IdentitySection />;
    case "security":      return <SecuritySection />;
    case "appearance":    return <AppearanceSection />;
    case "arena":         return <ArenaSection />;
    case "notifications": return <NotificationsSection />;
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [openAccordion, setOpenAccordion] = useState<SectionId | null>("identity");

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .accordion-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s ease;
        }
        .accordion-content.open {
          grid-template-rows: 1fr;
        }
        .accordion-inner {
          overflow: hidden;
        }
      `}</style>

      <div className="min-h-screen bg-bg-primary font-mono">
        {/* Page header */}
        <div className="border-b border-accent/[0.08] px-6 py-5 bg-bg-primary/95 sticky top-0 z-40 backdrop-blur-sm">
          <div className="text-[9px] tracking-[0.28em] text-accent/35 font-bold mb-1">// SYS_CONFIG</div>
          <h1 className="text-[20px] font-black tracking-[0.18em] text-accent [text-shadow:0_0_12px_rgba(var(--accent-rgb),0.5)]">
            SETTINGS
          </h1>
        </div>

        {isMobile ? (
          /* ── MOBILE: Accordion layout ── */
          <div className="px-4 py-4 flex flex-col gap-3">
            {SECTIONS.map((section) => {
              const isOpen = openAccordion === section.id;
              return (
                <div
                  key={section.id}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "border-accent/40 shadow-[inset_3px_0_0_var(--accent),0_0_20px_rgba(var(--accent-rgb),0.08)]"
                      : "border-accent/10"
                  }`}
                  style={isOpen ? { boxShadow: "inset 3px 0 0 var(--accent), 0 0 20px rgba(var(--accent-rgb),0.08)" } : {}}
                >
                  <button
                    onClick={() => setOpenAccordion(isOpen ? null : section.id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-bg-secondary min-h-[56px]"
                  >
                    <span className={`text-[11px] font-black tracking-[0.25em] ${isOpen ? "text-accent" : "text-text-secondary"}`}>
                      {section.shortLabel}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-accent/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div className={`accordion-content ${isOpen ? "open" : ""}`}>
                    <div className="accordion-inner">
                      <div className="p-5 bg-bg-primary border-t border-accent/10">
                        {renderSection(section.id)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── DESKTOP: Two-column layout ── */
          <div className="flex min-h-[calc(100vh-73px)]">
            {/* Left sidebar */}
            <aside className="w-[220px] shrink-0 border-r border-accent/[0.08] bg-bg-secondary/50 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto flex flex-col py-4">
              <div className="text-[8px] tracking-[0.3em] text-accent/25 font-bold px-4 pb-3 uppercase">
                Sections
              </div>
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 text-[10px] font-bold tracking-[0.18em] transition-all duration-150 border-l-[3px] ${
                      isActive
                        ? "border-accent bg-accent/[0.05] text-accent [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.5)]"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-accent/[0.02] hover:border-accent/20"
                    }`}
                  >
                    {section.shortLabel}
                  </button>
                );
              })}
            </aside>

            {/* Right panel */}
            <main className="flex-1 px-8 py-8 max-w-2xl">
              {renderSection(activeSection)}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
