"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { useFeedback, SectionHeader } from "../shared";
import { apiClient } from "../../../../../lib/api-client";
import { getAuthUsername, setAuthSession, getAuthUserId, getAuthAvatarUrl } from "../../../../../lib/client-security";
import { AvatarUpload } from "./AvatarUpload";
import { IdentityFields } from "./IdentityFields";
import { ConnectedAccounts } from "./ConnectedAccounts";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function IdentitySection({ isGuest = false }: { isGuest?: boolean }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("?");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasGithub, setHasGithub] = useState(false);

  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state: usernameFb, flash: flashUsername } = useFeedback();
  const { state: emailFb, flash: flashEmail } = useFeedback();
  const { state: avatarFb, flash: flashAvatar } = useFeedback();
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const { profile } = useAuth();

  useEffect(() => {
    const storedUsername = getAuthUsername() ?? "";
    const storedAvatar = getAuthAvatarUrl();
    setUsername(storedUsername);
    setInitials(storedUsername?.[0]?.toUpperCase() ?? "?");
    if (storedAvatar) setAvatarUrl(storedAvatar);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setEmail(profile.email ?? "");
    setOriginalEmail(profile.email ?? "");
    setHasGoogle(profile.hasGoogle ?? false);
    setHasGithub(profile.hasGithub ?? false);
    setUsername(profile.username ?? getAuthUsername() ?? "");
    setOriginalUsername(profile.username ?? "");
    setInitials((profile.username ?? getAuthUsername() ?? "")?.[0]?.toUpperCase() ?? "?");
    if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      flashAvatar("error", "ONLY JPG, PNG, OR WEBP");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      flashAvatar("error", "FILE TOO LARGE (2MB MAX)");
      return;
    }

    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await apiClient.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrl = res.data.avatarUrl as string;
      setAvatarUrl(newUrl);
      setAuthSession({
        userId: getAuthUserId(),
        username: getAuthUsername(),
        avatarUrl: newUrl,
      });
      flashAvatar("success", "AVATAR UPDATED");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "UPLOAD FAILED";
      flashAvatar("error", msg);
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [flashAvatar]);

  const saveUsername = async () => {
    if (isGuest) return;
    const newUsername = username.trim();
    if (!newUsername) {
      return flashUsername("error", "USERNAME CANNOT BE EMPTY");
    }
    if (newUsername.length < 3) {
      return flashUsername("error", "MIN 3 CHARACTERS");
    }

    setLoadingUsername(true);
    try {
      await apiClient.put("/users/identity", { username: newUsername });
      setAuthSession({ userId: getAuthUserId(), username: newUsername });
      setOriginalUsername(newUsername);
      setUsername(newUsername);
      setInitials(newUsername[0]?.toUpperCase() ?? "?");
      flashUsername("success");
    } catch (err: unknown) {
      setUsername(originalUsername);
      const e = err as { response?: { data?: { message?: string } } };
      flashUsername("error", e?.response?.data?.message ?? "FAILED");
    } finally { setLoadingUsername(false); }
  };

  const saveEmail = async () => {
    if (isGuest) return;
    const newEmail = email.trim();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return flashEmail("error", "INVALID EMAIL FORMAT");
    }

    setLoadingEmail(true);
    try {
      await apiClient.put("/users/identity", { email: newEmail });
      setOriginalEmail(newEmail);
      setEmail(newEmail);
      flashEmail("success");
    } catch (err: unknown) {
      setEmail(originalEmail);
      const e = err as { response?: { data?: { message?: string } } };
      flashEmail("error", e?.response?.data?.message ?? "FAILED");
    } finally { setLoadingEmail(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>MY PROFILE</SectionHeader>

      <AvatarUpload
        avatarUrl={avatarUrl}
        initials={initials}
        isGuest={isGuest}
        avatarLoading={avatarLoading}
        fileInputRef={fileInputRef}
        avatarFb={avatarFb}
        onUpload={handleAvatarUpload}
      />

      <IdentityFields
        username={username}
        originalUsername={originalUsername}
        onUsernameChange={setUsername}
        onSaveUsername={saveUsername}
        loadingUsername={loadingUsername}
        usernameFb={usernameFb}
        email={email}
        originalEmail={originalEmail}
        onEmailChange={setEmail}
        onSaveEmail={saveEmail}
        loadingEmail={loadingEmail}
        emailFb={emailFb}
        isGuest={isGuest}
      />

      <ConnectedAccounts hasGoogle={hasGoogle} hasGithub={hasGithub} />
    </div>
  );
}
