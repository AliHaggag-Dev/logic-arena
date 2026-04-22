import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Logic Arena",
  description: "Learn how Logic Arena collects, uses, and protects your personal data.",
};

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content:
      "When you register an account, we collect: your username, email address, and (if applicable) your public Google or GitHub profile information obtained via OAuth 2.0 authentication flows. We also collect usage data such as match results, script versions, ELO history, and session metadata. We do not collect payment information.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "We use your information to: operate and improve the Logic Arena platform; match you with opponents of similar skill; send important service notifications (e.g., email verification, security alerts); analyse platform-wide usage trends in aggregate, anonymised form; and fulfil any legal obligations.",
  },
  {
    title: "3. OAuth Authentication",
    content:
      "We support sign-in via Google and GitHub OAuth 2.0. When you authenticate through these providers, we receive only the data you have authorised: typically your public profile name, email address, and avatar. We do not receive or store your Google or GitHub passwords. Your OAuth tokens are stored securely and used solely for authentication purposes.",
  },
  {
    title: "4. Data Sharing & Third Parties",
    content:
      "We do not sell your personal data. We may share data with trusted third-party service providers who assist in operating our infrastructure (e.g., cloud hosting providers), subject to strict confidentiality agreements. We may disclose data when required by law or to protect the rights and safety of our users and platform.",
  },
  {
    title: "5. Data Retention",
    content:
      "We retain your account data for as long as your account is active. If you delete your account, we will remove your personally identifiable information within 30 days, except where retention is required by law. Match records and aggregate statistics may be retained in anonymised form indefinitely for platform integrity purposes.",
  },
  {
    title: "6. Cookies & Tracking",
    content:
      "We use essential session cookies to keep you authenticated. We may use analytics cookies with your consent to understand how operators use the platform. You can manage cookie preferences at any time via our Cookie Policy page.",
  },
  {
    title: "7. Security",
    content:
      "We use industry-standard measures to protect your data, including TLS encryption in transit, hashed passwords at rest, and access controls on our infrastructure. No method of transmission over the internet is 100% secure; we encourage you to use strong, unique passwords and enable any available security features.",
  },
  {
    title: "8. Children's Privacy",
    content:
      "Logic Arena is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately so we can remove it.",
  },
  {
    title: "9. Your Rights",
    content:
      "Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data; restrict or object to processing; and data portability. To exercise these rights, contact us at the address on our Contact page.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the 'Last updated' date. Continued use of the Service after changes are posted constitutes your acceptance of the updated policy.",
  },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-4" />
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-accent/50">
              Last updated: <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.5)]">January 2026</span>
            </p>
          </div>
        </div>

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
            Cookie questions? <Link href="/cookies" className="text-accent border-b border-accent/30 hover:border-accent hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)] pb-0.5 ml-2 transition-all">Cookie Policy →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
