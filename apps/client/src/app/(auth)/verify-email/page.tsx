"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/auth/verify-email", { email, code });
      setStatus("Verification successful. Rerouting...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setStatus(`[ERR] ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] font-mono p-6">
      <form onSubmit={handleVerify} className="w-full max-w-[400px] bg-black/60 border border-[#22d3ee]/30 p-8 rounded-xl flex flex-col gap-4 shadow-[#22d3ee]/10 shadow-[0_0_20px]">
        <h2 className="text-[#22d3ee] text-xl tracking-[0.2em] text-center mb-4">IDENTITY VERIFICATION</h2>
        <input type="text" placeholder="6-DIGIT CODE" value={code} onChange={e => setCode(e.target.value)} required minLength={6} maxLength={6} className="bg-transparent border border-[#22d3ee]/30 p-3 text-[#22d3ee] text-center tracking-[0.5em] focus:border-[#22d3ee]" />
        {status && <div className="text-center text-[10px] text-[#ef4444] mt-2">{status}</div>}
        <button type="submit" className="w-full mt-4 p-3 border border-[#22d3ee]/40 text-[#22d3ee] hover:bg-[#22d3ee]/10 tracking-[0.2em] transition-all">VERIFY</button>
      </form>
    </div>
  );
}
