"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CyberSelect, CyberSelectOption } from "../../../components/ui/CyberSelect";

type Priority = "" | "NICE_TO_HAVE" | "MODERATE" | "HIGH" | "CRITICAL";

const FEATURE_OPTIONS: CyberSelectOption[] = [
  { value: "NICE_TO_HAVE", label: "NICE TO HAVE", description: "Quality of life improvement" },
  { value: "MODERATE", label: "MODERATE", description: "Significantly improves workflow" },
  { value: "HIGH", label: "HIGH", description: "Missing feature blocking my strategy" },
  { value: "CRITICAL", label: "CRITICAL", description: "Core to the arena experience", colorClass: "text-accent" },
];

export default function FeatureRequestsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [priority, setPriority] = useState<Priority>("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  const inputClass =
    "w-full bg-bg-primary/80 border border-accent/50 rounded-lg p-3.5 text-text-primary text-[12px] placeholder:text-text-secondary/40 outline-none focus:border-accent/60 focus:bg-accent/5 transition-all duration-150 font-mono resize-none";

  const labelClass =
    "block text-[9px] font-black tracking-[0.35em] text-accent/60 uppercase mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-bg-primary font-mono relative overflow-hidden">
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--accent-rgb),0.012) 3px, rgba(var(--accent-rgb),0.012) 4px)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-accent/70 hover:text-accent uppercase mb-10 transition-all duration-300"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK
        </Link>

        {/* Hero */}
        <div className="mb-12 relative flex items-center bg-accent/5 border border-accent/20 rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.05)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
          <div className="px-10 py-10 relative z-10 w-full">
            <p className="text-[10px] font-black tracking-[0.45em] text-accent/60 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" />
              FEEDBACK
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] mb-4 uppercase">
              Request a Feature
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-4" />
            <p className="text-[12px] font-mono text-accent/70 leading-relaxed tracking-[0.03em] drop-shadow-[0_0_1px_rgba(var(--accent-rgb),0.1)] font-sans">
              Have an idea that would make Logic Arena even more legendary? Submit it below.
              Top requests are reviewed regularly.
            </p>
          </div>
        </div>

        {/* Sprint note */}
        <div className="mb-8 px-5 py-4 border border-accent/20 bg-accent/5 rounded-xl flex items-center gap-4 shadow-[0_0_15px_rgba(var(--accent-rgb),0.03)] backdrop-blur-sm relative overflow-hidden group hover:border-accent/40 transition-colors duration-300">
          <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-accent/40 group-hover:bg-accent transition-colors" />
          <span className="text-accent text-lg drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.4)]">◈</span>
          <p className="text-[10.5px] text-accent/80 tracking-[0.15em] leading-relaxed font-black uppercase drop-shadow-[0_0_2px_rgba(var(--accent-rgb),0.2)] font-sans font-bold">
            Top requests are reviewed regularly — the community votes on what gets built next.
          </p>
        </div>

        <div className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl p-8 mb-8 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] relative group">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent rounded-xl" />
          <div className="relative z-10 w-full">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full border-2 border-accent bg-accent/5 flex items-center justify-center text-4xl text-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] mb-2">
                  ✓
                </div>
                <h2 className="text-[16px] font-black tracking-[0.3em] text-accent uppercase drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
                  REQUEST SUBMITTED
                </h2>
                <p className="text-[13px] font-mono text-accent/60 max-w-md leading-[1.8] tracking-[0.03em]">
                  We've received your idea! We review community submissions constantly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setUseCase(""); setPriority(""); }}
                  className="mt-6 px-8 py-3.5 text-[11px] tracking-[0.3em] font-black uppercase border border-accent/30 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 hover:border-accent hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] transition-all duration-300"
                >
                  SUBMIT ANOTHER
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Feature Title */}
                <div>
                  <label htmlFor="feature-title" className={labelClass}>TITLE</label>
                  <input
                    id="feature-title"
                    type="text"
                    className={inputClass}
                    placeholder="What should we build?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="feature-description" className={labelClass}>DESCRIPTION</label>
                  <textarea
                    id="feature-description"
                    className={inputClass}
                    placeholder="Describe the feature in detail. What problem does it solve?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    disabled={loading}
                  />
                </div>

                {/* Use Case */}
                <div>
                  <label htmlFor="feature-usecase" className={labelClass}>USE CASE</label>
                  <textarea
                    id="feature-usecase"
                    className={inputClass}
                    placeholder="How would you use this? Walk us through a concrete scenario..."
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    required
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="feature-priority" className={labelClass}>PRIORITY</label>
                  <CyberSelect
                    id="feature-priority"
                    value={priority}
                    onChange={(val) => setPriority(val as Priority)}
                    options={FEATURE_OPTIONS}
                    placeholder="SELECT PRIORITY..."
                    disabled={loading}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group/btn flex items-center justify-center h-14 bg-accent/10 border border-accent/40 text-accent font-black 
                    text-[12px] tracking-[0.3em] uppercase rounded-lg hover:bg-accent/20 hover:border-accent/80 hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] 
                    transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
                  >
                    <div className="absolute inset-0 w-0 group-hover/btn:w-full bg-accent/5 transition-all duration-500 ease-out" />
                    <span className="relative z-10 flex items-center gap-3">
                      {loading ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>SUBMIT REQUEST <span>→</span></>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
