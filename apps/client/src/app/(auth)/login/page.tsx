"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/auth/login", { username, password });
      localStorage.setItem("jwtToken", response.data.accessToken);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      alert("Login failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="p-8 rounded-lg shadow-lg bg-gray-800 border border-green-500">
        <h2 className="text-2xl font-bold mb-6 text-green-400">Login to Logic Arena</h2>
        <div className="mb-4">
          <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="username">
            Username:
          </label>
          <input
            type="text"
            id="username"
            className="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="password">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login
          </button>
          <a href="/register" className="inline-block align-baseline font-bold text-sm text-green-500 hover:text-green-800">
            Don't have an account? Register
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
