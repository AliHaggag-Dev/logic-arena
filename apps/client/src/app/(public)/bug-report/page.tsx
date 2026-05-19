"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Bug, CheckCircle, Loader2, Send, XCircle } from "lucide-react";
import { CyberSelect, type CyberSelectOption } from "../../../components/ui/CyberSelect";
import { FieldLabel, StyledInput, StyledTextarea } from "../../../components/ui/FormHelpers";
import { apiClient } from "@/lib/api-client";

type Severity = "" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const BUG_OPTIONS: CyberSelectOption[] = [
  { value: "LOW",      label: "LOW",      description: "Minor visual glitch, cosmetic issue" },
  { value: "MEDIUM",   label: "MEDIUM",   description: "Feature partially broken or degraded" },
  { value: "HIGH",     label: "HIGH",     description: "Combat logic affected, data loss possible" },
  { value: "CRITICAL", label: "CRITICAL", description: "Platform crash or security vulnerability", colorClass: "text-red-500" },
];

export default function BugReportPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [severity, setSeverity] = useState<Severity>("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/feedback/bug-reports", {
        title,
        description,
        steps: steps || undefined,
        severity,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to submit bug report. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setSubmitted(false); setError(""); setTitle(""); setDescription(""); setSteps(""); setSeverity(""); };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--accent-rgb),0.008) 3px, rgba(var(--accent-rgb),0.008) 4px)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--accent-rgb),0.025) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--accent-rgb),0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
        {/* Back */}
        <Link href="/dashboard" className="group inline-flex items-center gap-2.5 mb-10 transition-all" style={{ color: "rgba(var(--accent-rgb),0.6)" }}>
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase group-hover:text-accent transition-colors" style={{ fontFamily: "var(--font-mono)" }}>Back to Home</span>
        </Link>

        {/* Hero */}
        <header className="mb-10 relative rounded-2xl overflow-hidden" style={{ background: "rgba(var(--accent-rgb),0.04)", border: "1px solid rgba(var(--accent-rgb),0.18)", boxShadow: "inset 0 0 40px rgba(var(--accent-rgb),0.04)" }}>
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "linear-gradient(to bottom, rgba(var(--accent-rgb),0.2), var(--accent), rgba(var(--accent-rgb),0.2))", boxShadow: "0 0 20px rgba(var(--accent-rgb),0.6)" }} />
          <div className="px-8 sm:px-10 py-8 relative z-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
              <span className="text-[9px] font-black tracking-[0.5em] uppercase" style={{ color: "rgba(var(--accent-rgb),0.5)", fontFamily: "var(--font-mono)" }}>Submit an Issue</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.15em] uppercase mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", textShadow: "0 0 40px rgba(var(--accent-rgb),0.35)" }}>
              Bug Report
            </h1>
            <div className="h-px max-w-sm mb-4" style={{ background: "linear-gradient(to right, rgba(var(--accent-rgb),0.5), transparent)" }} />
            <p className="text-[13px] leading-[1.8]" style={{ color: "rgba(var(--accent-rgb),0.65)", fontFamily: "var(--font-mono)" }}>
              Found a defect in the engine? Our engineering team investigates every report. Detailed reproduction steps dramatically accelerate the fix cycle — please be specific.
            </p>
          </div>
        </header>

        {/* Responsible disclosure callout */}
        <div className="mb-6 flex gap-3 items-start p-4 rounded-xl" style={{ background: "rgba(var(--sem-warning-rgb,245,158,11),0.06)", border: "1px solid rgba(var(--sem-warning-rgb,245,158,11),0.2)" }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--sem-warning,#f59e0b)" }} />
          <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(var(--sem-warning-rgb,245,158,11),0.8)", fontFamily: "var(--font-mono)" }}>
            <strong>Security vulnerability?</strong> If you have discovered a potential security issue, please use CRITICAL severity and describe it in general terms only. Do not include exploit payloads in this form. We will reach out privately to coordinate responsible disclosure.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl overflow-hidden bg-bg-secondary/50" style={{ border: "1px solid rgba(var(--accent-rgb),0.15)", backdropFilter: "blur(12px)" }}>
          <div className="px-6 sm:px-8 py-5 border-b flex items-center gap-3" style={{ borderColor: "rgba(var(--accent-rgb),0.1)" }}>
            <Bug size={14} style={{ color: "var(--accent)" }} />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: "rgba(var(--accent-rgb),0.6)", fontFamily: "var(--font-mono)" }}>Report Details</span>
          </div>

          <div className="px-6 sm:px-8 py-7">
            {submitted ? (
              <div className="flex flex-col items-center gap-5 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(var(--sem-success-rgb,34,197,94),0.1)", border: "1px solid rgba(var(--sem-success-rgb,34,197,94),0.3)" }}>
                  <CheckCircle size={28} style={{ color: "var(--sem-success,#22c55e)" }} />
                </div>
                <div>
                  <h2 className="text-[15px] font-black tracking-[0.25em] uppercase mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>Report Submitted</h2>
                  <p className="text-[13px] leading-[1.8]" style={{ color: "rgba(var(--accent-rgb),0.6)", fontFamily: "var(--font-mono)" }}>Our engineering team will investigate. Critical and High severity issues are prioritised immediately.</p>
                </div>
                <button type="button" onClick={reset} className="mt-2 px-7 py-3 text-[11px] font-black tracking-[0.25em] uppercase rounded-xl transition-all duration-300 cursor-pointer hover:bg-accent/15 hover:border-accent/50 hover:-translate-y-0.5" style={{ border: "1px solid rgba(var(--accent-rgb),0.3)", background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <FieldLabel htmlFor="bug-title">// Bug Title</FieldLabel>
                  <StyledInput id="bug-title" type="text" placeholder="Short, descriptive title..." value={title} onChange={e => setTitle(e.target.value)} required disabled={loading} />
                </div>
                <div>
                  <FieldLabel htmlFor="bug-description">// Description</FieldLabel>
                  <StyledTextarea id="bug-description" placeholder="What happened? What did you expect to happen?" value={description} onChange={e => setDescription(e.target.value)} required rows={4} disabled={loading} />
                </div>
                <div>
                  <FieldLabel htmlFor="bug-steps">// Steps to Reproduce</FieldLabel>
                  <StyledTextarea id="bug-steps" placeholder={"1. Navigate to...\n2. Click...\n3. Observe..."} value={steps} onChange={e => setSteps(e.target.value)} required rows={4} disabled={loading} />
                </div>
                <div>
                  <FieldLabel htmlFor="bug-severity">// Severity</FieldLabel>
                  <CyberSelect id="bug-severity" value={severity} onChange={val => setSeverity(val as Severity)} options={BUG_OPTIONS} placeholder="SELECT SEVERITY..." disabled={loading} />
                </div>
                {error && (
                  <div className="flex gap-3 items-start p-4 rounded-xl" style={{ background: "rgba(var(--sem-danger-rgb,239,68,68),0.08)", border: "1px solid rgba(var(--sem-danger-rgb,239,68,68),0.25)" }}>
                    <XCircle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--sem-danger,#ef4444)" }} />
                    <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(var(--sem-danger-rgb,239,68,68),0.85)", fontFamily: "var(--font-mono)" }}>{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading} className="relative group/btn flex items-center justify-center gap-3 h-14 rounded-xl text-[12px] font-black tracking-[0.25em] uppercase transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(var(--accent-rgb),0.15)]" style={{ background: "rgba(var(--accent-rgb),0.1)", border: "1px solid rgba(var(--accent-rgb),0.4)", color: "var(--accent)" }}>
                  <div className="absolute inset-0 w-0 group-hover/btn:w-full transition-all duration-500 ease-out" style={{ background: "rgba(var(--accent-rgb),0.07)" }} />
                  <span className="relative z-10 flex items-center gap-3">
                    {loading ? (<><Loader2 size={14} className="animate-spin" />Submitting...</>) : (<><Send size={14} />Submit Issue</>)}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
