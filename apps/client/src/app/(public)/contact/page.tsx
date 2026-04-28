"use client";

import React, { useState } from "react";
import Link from "next/link";

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { icon: <GitHubIcon />, label: "GitHub", href: "https://github.com/Ali-Haggag7/logic-arena" },
  { icon: <LinkedInIcon />, label: "LinkedIn", href: "https://www.linkedin.com/in/ali-haggag7" },
  { icon: <PortfolioIcon />, label: "Portfolio", href: "https://alihaggag.me" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
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
              CONTACT
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] mb-4 uppercase">
              Contact Us
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-4" />
            <p className="text-[12px] font-mono text-accent/70 leading-relaxed tracking-[0.03em] drop-shadow-[0_0_1px_rgba(var(--accent-rgb),0.1)]">
              Open a secure channel to the Logic Arena community and developers. We respond within 24–48 hours.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl p-8 mb-8 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent" />
          <div className="relative z-10 w-full">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full border-2 border-accent bg-accent/5 flex items-center justify-center text-4xl text-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] mb-2">
                  ✓
                </div>
                <h2 className="text-[16px] font-black tracking-[0.3em] text-accent uppercase drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
                  MESSAGE SENT
                </h2>
                <p className="text-[13px] font-mono text-accent/60 max-w-md leading-[1.8] tracking-[0.03em]">
                  Your message has been successfully sent. Expect a response within 24–48 hours.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                  className="mt-6 px-8 py-3.5 text-[11px] tracking-[0.3em] font-black uppercase border border-accent/30 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 hover:border-accent hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] transition-all duration-300"
                >
                  SEND ANOTHER
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className={labelClass}>// YOUR NAME</label>
                    <input
                      id="contact-name"
                      type="text"
                      className={inputClass}
                      placeholder="Your name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className={labelClass}>// EMAIL_ADDRESS</label>
                    <input
                      id="contact-email"
                      type="email"
                      className={inputClass}
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="contact-subject" className={labelClass}>// SUBJECT</label>
                  <input
                    id="contact-subject"
                    type="text"
                    className={inputClass}
                    placeholder="Brief subject line..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className={labelClass}>// YOUR MESSAGE</label>
                  <textarea
                    id="contact-message"
                    className={inputClass}
                    placeholder="Your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
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
                          Sending...
                        </>
                      ) : (
                        <>SEND MESSAGE <span>→</span></>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Social row */}
        <div className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-accent/2 to-transparent" />
          <p className="text-[11px] font-black tracking-[0.3em] text-accent/60 uppercase z-10">
            OR REACH US ON_
          </p>
          <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-5 py-3 rounded-lg border border-accent/20 bg-bg-primary/50 text-accent/70 hover:text-accent hover:border-accent/50 hover:bg-accent/10 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)] transition-all duration-300 text-[10.5px] tracking-[0.2em] font-black uppercase"
                style={{ minHeight: "48px" }}
              >
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
