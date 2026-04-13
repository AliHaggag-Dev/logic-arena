"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({ message: "", type: null });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: "AUTHENTICATING CREDENTIALS...", type: null });

    try {
      const response = await apiClient.post("/auth/login", { username, password });
      const token = response.data.accessToken;
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("token", token); // Sync both keys for now as they are used differently in the app

      setStatus({ message: "[SYS] ACCESS GRANTED. REROUTING...", type: "success" });

      // Brief pause to show the success state before redirecting
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

    } catch (error: any) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      setStatus({
        message: `[ERR] ACCESS DENIED: ${error.response?.data?.message || error.message}`,
        type: "error"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 font-mono selection:bg-cyan-500/30 relative overflow-hidden">

      {/* Background Starfield/Grid Illusion */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(8, 145, 178, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(8, 145, 178, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="w-full max-w-md p-8 bg-black/60 backdrop-blur-xl border border-cyan-900/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative z-20">

        {/* Decorative Tech Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
        <div className="absolute top-2 right-3 text-[9px] text-green-500/50 tracking-widest pointer-events-none">AUTH_NODE_V1</div>

        <div className="mb-8 text-center">
          <h1 className="text-cyan-400 font-black text-3xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-2">LOGIC ARENA</h1>
          <h2 className="text-green-400/80 text-xs tracking-widest uppercase">
            [ Authenticate Operator ]
          </h2>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-cyan-600 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="username">
              Operator Name
            </label>
            <input
              type="text"
              id="username"
              className="w-full bg-black/50 border border-cyan-900/50 rounded-lg p-3 text-cyan-300 outline-none focus:border-cyan-400 focus:bg-cyan-950/20 transition-all shadow-inner text-xs placeholder-cyan-900/50"
              placeholder="Enter designated alias"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-cyan-600 uppercase tracking-[0.2em] font-bold ml-1" htmlFor="password">
              Security Key
            </label>
            <input
              type="password"
              id="password"
              className="w-full bg-black/50 border border-cyan-900/50 rounded-lg p-3 text-cyan-300 outline-none focus:border-cyan-400 focus:bg-cyan-950/20 transition-all shadow-inner text-xs placeholder-cyan-900/50"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* In-UI Status Terminal instead of alert() */}
          {status.message && (
            <div className={`p-3 rounded border text-xs break-words ${status.type === 'error' ? 'bg-red-950/40 border-red-900/50 text-red-400' :
              status.type === 'success' ? 'bg-green-950/40 border-green-900/50 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]' :
                'bg-cyan-950/40 border-cyan-900/50 text-cyan-400 animate-pulse'
              }`}>
              {status.message}
            </div>
          )}

          <div className="mt-2 flex flex-col gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600/20 border border-green-500/50 text-green-300 font-bold text-xs hover:bg-green-600/40 hover:text-white transition-all rounded-lg uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(34,197,94,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "VERIFYING..." : "INITIATE LOGIN"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-cyan-800 hover:text-cyan-400 text-[10px] uppercase tracking-widest transition-colors focus:outline-none"
              >
                No clearance? Request Access
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;