"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { AlertTriangle } from "lucide-react";
import { useFeedback, SectionHeader, SettingsInput, SaveButton, PasswordStrength } from "./Shared";

export function SecuritySection({ isGuest = false }: { isGuest?: boolean }) {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const { state: pwFb, flash: flashPw } = useFeedback();
  const [loadingPw, setLoadingPw] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [storedUsername, setStoredUsername] = useState("");
  const { state: deleteFb, flash: flashDelete } = useFeedback();
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    setStoredUsername(localStorage.getItem("username") ?? "");
  }, [showDeleteModal]);

  const changePassword = async () => {
    if (isGuest) return;
    if (!currentPw || !newPw || !confirmPw) {
      return flashPw("error", "ALL FIELDS REQUIRED");
    }
    if (newPw !== confirmPw) {
      return flashPw("error", "PASSWORDS DO NOT MATCH");
    }
    if (newPw.length < 8) {
      return flashPw("error", "MIN 8 CHARACTERS");
    }
    setLoadingPw(true);
    try {
      await apiClient.put("/users/password", { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      flashPw("success", "CREDENTIALS UPDATED");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      flashPw("error", e?.response?.data?.message ?? "FAILED");
    } finally { setLoadingPw(false); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== storedUsername) {
      return flashDelete("error", "USERNAME MISMATCH");
    }
    setLoadingDelete(true);
    try {
      await apiClient.delete("/users/account", { data: { confirmation: deleteConfirm } });
      ["userId", "username"].forEach((k) => localStorage.removeItem(k));
      router.push("/login");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      flashDelete("error", e?.response?.data?.message ?? "FAILED");
      setLoadingDelete(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>SECURITY</SectionHeader>

      {/* Password change */}
      <div className="flex flex-col gap-4">
        <SettingsInput label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" disabled={isGuest} isGuest={isGuest} />
        <SettingsInput label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="••••••••" disabled={isGuest} isGuest={isGuest} />
        <PasswordStrength password={newPw} />
        <SettingsInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="••••••••" disabled={isGuest} isGuest={isGuest} />
        <SaveButton onClick={changePassword} loading={loadingPw} feedback={pwFb} label="UPDATE CREDENTIALS" isGuest={isGuest} disabled={!currentPw || !newPw || !confirmPw} />
      </div>

      {/* Danger zone */}
      <div className={`mt-4 p-5 border border-red-500/30 rounded-xl bg-red-500/[0.03] relative overflow-hidden ${isGuest ? "grayscale-[0.8]" : ""}`}>
        <div
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
          style={{ background: "rgba(239,68,68,0.6)" }}
        />
        <div className="text-[10px] font-black tracking-[0.3em] uppercase text-red-400 mb-2 ml-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> DANGER ZONE
        </div>
        <p className="text-[11px] text-text-secondary/70 ml-2 mb-4 tracking-[0.05em]">
          Permanently deletes your account and all associated data. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => !isGuest && setShowDeleteModal(true)}
          className={`ml-2 px-5 py-2 bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg text-[10px] font-bold tracking-[0.2em] font-mono transition-all duration-150 ${isGuest ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-red-500/20 hover:border-red-500/70"}`}
        >
          {isGuest ? "SIGN IN TO DELETE" : "DELETE ACCOUNT"}
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
            <h3 className="text-red-400 font-black tracking-[0.15em] text-lg mb-3">DELETE ACCOUNT?</h3>
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
                type="button"
                onClick={deleteAccount}
                disabled={loadingDelete || deleteConfirm !== storedUsername}
                className="flex-1 py-2.5 text-[10px] tracking-[0.18em] font-bold border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingDelete ? "TERMINATING..." : "CONFIRM DELETE"}
              </button>
              <button
                type="button"
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
