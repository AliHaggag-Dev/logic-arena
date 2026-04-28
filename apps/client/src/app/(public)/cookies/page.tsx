import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — Logic Arena",
  description: "Understand how Logic Arena uses cookies and how to manage your preferences.",
};

const COOKIE_TYPES = [
  {
    type: "ESSENTIAL",
    description: "Required for the platform to function correctly. Cannot be disabled.",
    examples: [
      { name: "auth_session", purpose: "Keeps you logged in securely across page loads." },
      { name: "csrf_token", purpose: "Protects forms from cross-site request forgery attacks." },
      { name: "theme_prefs", purpose: "Stores your selected theme (cyberpunk, light, or desert)." },
    ],
  },
  {
    type: "ANALYTICS",
    description: "Help us understand how users use Logic Arena. Only active with your consent.",
    examples: [
      { name: "_arena_analytics", purpose: "Tracks page views and feature engagement in aggregate." },
      { name: "_session_duration", purpose: "Measures how long sessions last to improve performance." },
      { name: "_feature_flags", purpose: "Used to A/B test new features on a subset of users." },
    ],
  },
];

const SECTIONS = [
  {
    title: "What Are Cookies?",
    content:
      "Cookies are small text files stored in your browser by websites you visit. They are widely used to make platforms work efficiently, remember your preferences, and provide data to site owners.",
  },
  {
    title: "How We Use Cookies",
    content:
      "Logic Arena uses cookies primarily to maintain authentication sessions and remember your UI preferences (such as your chosen theme). With your consent, we may also use analytics cookies to improve the platform based on how users interact with it.",
  },
  {
    title: "Managing Your Cookie Preferences",
    content:
      "You can control and delete cookies through your browser settings at any time. Note that disabling essential cookies will prevent you from logging in or using core platform features. Analytics cookies can be disabled without affecting platform functionality.",
  },
  {
    title: "Third-Party Cookies",
    content:
      "When you sign in via Google or GitHub OAuth, those providers may set their own cookies during the sign-in flow. Logic Arena does not control these third-party cookies. Please review Google's and GitHub's respective cookie and privacy policies for details.",
  },
  {
    title: "Cookie Lifespan",
    content:
      "Essential session cookies expire when you close your browser or after a fixed idle timeout (7 days by default). Analytics cookies are retained for a maximum of 12 months. Preference cookies persist for 365 days.",
  },
  {
    title: "Updates to This Policy",
    content:
      "We may update this Cookie Policy from time to time. Changes will be reflected on this page with an updated 'Last updated' date. We recommend checking back periodically.",
  },
];

export default function CookiesPage() {
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

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-accent/70 hover:text-accent uppercase mb-10 transition-all duration-300"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK
        </Link>

        <div className="mb-12 relative flex items-center bg-accent/5 border border-accent/20 rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.05)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
          <div className="px-10 py-10 relative z-10 w-full">
            <p className="text-[10px] font-black tracking-[0.45em] text-accent/60 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" />
              LEGAL_DOCUMENT
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] mb-4 uppercase">
              Cookie Policy
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-4" />
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-accent/50">
              Last updated: <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.5)]">January 2026</span>
            </p>
          </div>
        </div>

        {/* Cookie type tables */}
        <div className="flex flex-col gap-6 mb-8">
          {COOKIE_TYPES.map((ct) => (
            <div
              key={ct.type}
              className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] group transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] relative"
            >
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-accent/20 bg-accent/[0.03] relative z-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-[12px] font-black tracking-[0.25em] uppercase text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.3)]">
                    {ct.type} COOKIES
                  </h2>
                </div>
                <span
                  className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-md shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.1)]"
                  style={{
                    background: ct.type === "ESSENTIAL" ? "rgba(var(--accent-rgb),0.12)" : "rgba(var(--accent-rgb),0.05)",
                    border: `1px solid ${ct.type === "ESSENTIAL" ? "rgba(var(--accent-rgb),0.4)" : "rgba(var(--accent-rgb),0.2)"}`,
                    color: "var(--accent)",
                  }}
                >
                  {ct.type === "ESSENTIAL" ? "ALWAYS ON" : "OPT-IN"}
                </span>
              </div>
              <div className="px-6 pt-5 pb-5 relative z-10">
                <p className="text-[12.5px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em] mb-4">{ct.description}</p>
                <div className="flex flex-col gap-2">
                  {ct.examples.map((ex) => (
                    <div key={ex.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-t border-accent/10 group-hover:border-accent/20 transition-colors">
                      <code
                        className="text-[11px] text-accent tracking-widest px-2 py-0.5 bg-accent/5 rounded border border-accent/10"
                      >
                        {ex.name}
                      </code>
                      <p className="text-[12px] font-mono text-accent/60 leading-relaxed">{ex.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* General sections */}
        <div className="bg-bg-secondary/40 backdrop-blur-sm border border-accent/20 rounded-xl p-8 flex flex-col gap-4 shadow-[0_0_30px_rgba(var(--accent-rgb),0.03)] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent/[0.02] to-transparent" />
          
          {SECTIONS.map((section) => (
            <div 
              key={section.title} 
              className="group p-5 rounded-lg border border-transparent hover:border-accent/20 hover:bg-accent/[0.03] hover:shadow-[inset_0_0_15px_rgba(var(--accent-rgb),0.05)] transition-all duration-300"
            >
              <h2 className="text-[12px] font-black tracking-[0.2em] text-accent uppercase mb-3 flex items-center gap-3">
                <span className="text-accent/40 font-light text-[14px]">›</span>
                {section.title}
              </h2>
              <p className="text-[12.5px] font-mono text-accent/70 leading-[1.8] tracking-[0.03em] drop-shadow-[0_0_1px_rgba(var(--accent-rgb),0.1)]">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 mb-8 text-center bg-accent/5 border border-accent/10 p-6 rounded-xl">
          <p className="text-[11px] font-mono text-accent/60 tracking-[0.2em] uppercase">
            More questions? <Link href="/contact" className="text-accent border-b border-accent/30 hover:border-accent hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)] pb-0.5 ml-2 transition-all">Contact us →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
