"use client";

import React from "react";
import { SettingsInput, SaveButton } from "../shared/inputs";
import { FeedbackState } from "../shared/types";

interface Props {
  username: string;
  originalUsername: string;
  onUsernameChange: (v: string) => void;
  onSaveUsername: () => void;
  loadingUsername: boolean;
  usernameFb: FeedbackState;

  email: string;
  originalEmail: string;
  onEmailChange: (v: string) => void;
  onSaveEmail: () => void;
  loadingEmail: boolean;
  emailFb: FeedbackState;

  isGuest: boolean;
}

export function IdentityFields({
  username, originalUsername, onUsernameChange, onSaveUsername, loadingUsername, usernameFb,
  email, originalEmail, onEmailChange, onSaveEmail, loadingEmail, emailFb,
  isGuest,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <SettingsInput label="Display Name" value={username} onChange={onUsernameChange} placeholder="Enter username" disabled={isGuest} isGuest={isGuest} />
        <SaveButton onClick={onSaveUsername} loading={loadingUsername} feedback={usernameFb} isGuest={isGuest} disabled={username === originalUsername || !username.trim()} />
      </div>

      <div className="flex flex-col gap-3">
        <SettingsInput label="Email Address" value={email} onChange={onEmailChange} type="email" placeholder="Enter email" disabled={isGuest} isGuest={isGuest} />
        <SaveButton onClick={onSaveEmail} loading={loadingEmail} feedback={emailFb} isGuest={isGuest} disabled={email === originalEmail || !email.trim()} />
      </div>
    </>
  );
}
