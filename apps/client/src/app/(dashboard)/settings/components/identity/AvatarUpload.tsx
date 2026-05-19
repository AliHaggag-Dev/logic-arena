"use client";

import React from "react";
import { Camera, Loader2 } from "lucide-react";
import { FeedbackState } from "../shared/types";

const ACCEPTED_AVATAR_TYPES = "image/png, image/jpeg, image/webp";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

interface Props {
  avatarUrl: string | null;
  initials: string;
  isGuest: boolean;
  avatarLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  avatarFb: FeedbackState;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUpload({ avatarUrl, initials, isGuest, avatarLoading, fileInputRef, avatarFb, onUpload }: Props) {
  return (
    <div className="flex items-center gap-4 p-4 bg-accent/[0.03] border border-accent/[0.08] rounded-xl">
      <button
        type="button"
        onClick={() => !isGuest && fileInputRef.current?.click()}
        disabled={isGuest || avatarLoading}
        aria-label="Upload avatar"
        className={`relative w-14 h-14 rounded-full bg-accent/15 border-2 border-accent/40 flex items-center justify-center text-[22px] font-black text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] shrink-0 overflow-hidden group transition-all duration-300 ${
          isGuest ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-accent/70 hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.4)]"
        }`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Your avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}

        {!isGuest && !avatarLoading && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera size={18} className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
          </div>
        )}

        {avatarLoading && (
          <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <Loader2 size={22} className="text-accent animate-spin drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]" />
          </div>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_AVATAR_TYPES}
        className="hidden"
        onChange={onUpload}
        aria-label="Choose avatar image"
        tabIndex={-1}
      />

      <div className="flex-1 min-w-0">
        <div className="text-[9px] tracking-[0.22em] text-accent/70 font-bold uppercase mb-0.5">
          Profile Picture
        </div>
        <div className="text-[11px] text-text-secondary tracking-[0.1em]">
          {isGuest ? "Sign in to upload an avatar" : "Click to upload — JPG, PNG, or WebP (2MB max)"}
        </div>
        {avatarFb.status === "success" && (
          <span className="text-[9px] text-green-400 tracking-[0.15em] font-bold animate-pulse mt-1 block" aria-live="polite" role="status">
            ✓ {avatarFb.message}
          </span>
        )}
        {avatarFb.status === "error" && (
          <span className="text-[9px] text-red-400 tracking-[0.15em] font-bold mt-1 block" aria-live="polite" role="status">
            ✕ {avatarFb.message}
          </span>
        )}
      </div>
    </div>
  );
}
