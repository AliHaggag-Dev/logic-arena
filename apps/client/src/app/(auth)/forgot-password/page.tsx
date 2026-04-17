"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus("Reset link sent to your comms link.");
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1500);
    } catch (err: any) {
      setStatus(`[ERR] ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] font-mono p-6">
      <form onSubmit={handleForgot} className="w-full max-w-[400px] bg-black/60 border border-[#a855f7]/30 p-8 rounded-xl flex flex-col gap-4 shadow-[#a855f7]/10 shadow-[0_0_20px]">
        <h2 className="text-[#a855f7] text-xl tracking-[0.2em] text-center mb-4">RECOVER ACCESS</h2>
        <input type="email" placeholder="COMMS LINK (EMAIL)" value={email} onChange={e => setEmail(e.target.value)} required className="bg-transparent border border-[#a855f7]/30 p-3 text-[#a855f7] tracking-[0.1em] focus:border-[#a855f7]" />
        {status && <div className="text-center text-[10px] text-[#ef4444] mt-2">{status}</div>}
        <button type="submit" className="w-full mt-4 p-3 border border-[#a855f7]/40 text-[#a855f7] hover:bg-[#a855f7]/10 tracking-[0.2em] transition-all">REQUEST RESET</button>
      </form>
    </div>
  );
}
