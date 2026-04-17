"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

export default function ResetPasswordPage() {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/auth/reset-password", { email, code, newPassword });
      setStatus("Security key updated successfully.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setStatus(`[ERR] ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] font-mono p-6">
      <form onSubmit={handleReset} className="w-full max-w-[400px] bg-black/60 border border-[#a855f7]/30 p-8 rounded-xl flex flex-col gap-4 shadow-[#a855f7]/10 shadow-[0_0_20px]">
        <h2 className="text-[#a855f7] text-xl tracking-[0.2em] text-center mb-4">NEW SECURITY KEY</h2>
        <input type="text" placeholder="6-DIGIT CODE" value={code} onChange={e => setCode(e.target.value)} required minLength={6} maxLength={6} className="bg-transparent border border-[#a855f7]/30 p-3 text-[#a855f7] text-center tracking-[0.5em] focus:border-[#a855f7]" />
        <input type="password" placeholder="NEW KEY" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="bg-transparent border border-[#a855f7]/30 p-3 text-[#a855f7] tracking-[0.2em] focus:border-[#a855f7]" />
        {status && <div className="text-center text-[10px] text-[#ef4444] mt-2">{status}</div>}
        <button type="submit" className="w-full mt-4 p-3 border border-[#a855f7]/40 text-[#a855f7] hover:bg-[#a855f7]/10 tracking-[0.2em] transition-all">CONFIRM</button>
      </form>
    </div>
  );
}
