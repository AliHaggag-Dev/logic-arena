"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("userId");
    const username = params.get("username");

    if (token && userId && username) {
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center font-mono">
      <div className="text-accent text-[12px] tracking-[0.3em] animate-pulse">
        AUTHENTICATING...
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
