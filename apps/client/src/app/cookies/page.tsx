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
    description: "Help us understand how operators use Logic Arena. Only active with your consent.",
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
      "Logic Arena uses cookies primarily to maintain authentication sessions and remember your UI preferences (such as your chosen theme). With your consent, we may also use analytics cookies to improve the platform based on how operators interact with it.",
  },
  {
    title: "Managing Your Cookie Preferences",
    content:
      "You can control and delete cookies through your browser settings at any time. Note that disabling essential cookies will prevent you from logging in or using core platform features. Analytics cookies can be disabled without affecting platform functionality.",
  },
  {
    title: "Third-Party Cookies",
    content:
      "When you authenticate via Google or GitHub OAuth, those providers may set their own cookies during the authentication flow. Logic Arena does not control these third-party cookies. Please review Google's and GitHub's respective cookie and privacy policies for details.",
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
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-accent hover:text-accent/70 uppercase mb-10 transition-colors duration-150"
        >
          ← BACK
        </Link>

        <div className="mb-12 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/50 rounded-tl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/50 rounded-br" />
          <div className="px-6 py-8">
            <p className="text-[10px] font-black tracking-[0.45em] text-accent/60 uppercase mb-3">
              ⌐ LEGAL_DOCUMENT ¬
            </p>
            <h1 className="text-4xl font-black tracking-[0.15em] text-accent drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] mb-4 uppercase">
              Cookie Policy
            </h1>
            <p className="text-[11px] text-text-secondary tracking-[0.15em]">
              Last updated: <span className="text-accent/70">January 2026</span>
            </p>
          </div>
        </div>

        {/* Cookie type tables */}
        <div className="flex flex-col gap-6 mb-8">
          {COOKIE_TYPES.map((ct) => (
            <div
              key={ct.type}
              className="bg-card border border-accent/50 rounded-xl overflow-hidden"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-accent/50 bg-bg-secondary/40">
                <div className="flex items-center gap-2">
                  <span className="text-accent/70 font-mono text-xs">⌐</span>
                  <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-accent">
                    {ct.type} COOKIES
                  </h2>
                  <span className="text-accent/70 font-mono text-xs">¬</span>
                </div>
                <span
                  className="text-[9px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded"
                  style={{
                    background: ct.type === "ESSENTIAL" ? "rgba(var(--accent-rgb),0.12)" : "rgba(var(--accent-rgb),0.06)",
                    border: `1px solid ${ct.type === "ESSENTIAL" ? "rgba(var(--accent-rgb),0.4)" : "rgba(var(--accent-rgb),0.2)"}`,
                    color: "var(--accent)",
                  }}
                >
                  {ct.type === "ESSENTIAL" ? "ALWAYS ON" : "OPT-IN"}
                </span>
              </div>
              <div className="px-6 pt-3 pb-1">
                <p className="text-[11px] text-text-secondary leading-relaxed mb-4">{ct.description}</p>
                <div className="flex flex-col gap-2">
                  {ct.examples.map((ex) => (
                    <div key={ex.name} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-t border-accent/50/40">
                      <code
                        className="text-[10px] text-accent shrink-0 font-bold"
                        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                      >
                        {ex.name}
                      </code>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{ex.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pb-4" />
            </div>
          ))}
        </div>

        {/* General sections */}
        <div className="bg-card border border-accent/50 rounded-xl p-6 flex flex-col gap-6" style={{ boxShadow: "var(--card-shadow)" }}>
          {SECTIONS.map((section) => (
            <div key={section.title} className="border-b border-accent/50/50 last:border-0 pb-5 last:pb-0">
              <h2 className="text-[11px] font-black tracking-[0.2em] text-accent uppercase mb-2">
                {section.title}
              </h2>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-text-secondary/50 tracking-[0.2em]">
            More questions? <Link href="/contact" className="text-accent hover:text-accent/70 transition-colors">Contact us →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
