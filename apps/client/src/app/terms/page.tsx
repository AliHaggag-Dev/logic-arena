import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Logic Arena",
  description: "Read the Logic Arena Terms of Service that govern your use of the platform.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using Logic Arena (the 'Service'), you agree to be bound by these Terms of Service. If you do not agree to these terms you may not use the Service. Logic Arena reserves the right to update these terms at any time; continued use constitutes acceptance of the revised terms.",
  },
  {
    title: "2. Account Eligibility",
    content:
      "You must be at least 13 years of age to create an account. By registering you represent that all information you provide is accurate. You are responsible for maintaining the security of your credentials and for all activity that occurs under your account.",
  },
  {
    title: "3. Permitted Use",
    content:
      "Logic Arena is a competitive programming and robot combat simulation platform. You may use the Service to write AliScript programs, deploy virtual robots, and compete in matches. You may not use the Service for any unlawful purpose or in a way that could damage, disable, or impair the platform.",
  },
  {
    title: "4. User-Generated Content",
    content:
      "All scripts, programs, and content you create and submit to Logic Arena remain your intellectual property. By submitting content you grant Logic Arena a non-exclusive, worldwide, royalty-free license to host, store, display, and use that content for the purposes of operating the Service.",
  },
  {
    title: "5. Prohibited Conduct",
    content:
      "You agree not to: (a) attempt to circumvent the AliScript sandbox or execution environment; (b) submit code designed to harm the platform or other users; (c) exploit bugs or vulnerabilities without reporting them; (d) engage in harassment, hate speech, or abusive behaviour toward other operators; (e) create multiple accounts to gain an unfair competitive advantage.",
  },
  {
    title: "6. Competitive Integrity",
    content:
      "Match results are final once recorded by the combat engine. Any attempt to manipulate match outcomes through external means, collusion, or platform exploits will result in immediate account suspension and removal from leaderboards.",
  },
  {
    title: "7. Service Availability",
    content:
      "Logic Arena strives for 99.9% uptime but does not guarantee uninterrupted access to the Service. Scheduled maintenance windows will be announced 24 hours in advance wherever possible. We are not liable for losses arising from service interruptions.",
  },
  {
    title: "8. Intellectual Property",
    content:
      "All platform code, designs, graphics, the AliScript language specification, and the Logic Arena brand are the intellectual property of Logic Arena and its licensors. You are granted a limited, non-transferable licence to use the platform for personal and competitive purposes only.",
  },
  {
    title: "9. Termination",
    content:
      "Logic Arena may suspend or terminate your account at any time for violations of these terms, without prior notice. Upon termination you lose access to your account, scripts, and match history. Sections 4, 8, and 10 survive termination.",
  },
  {
    title: "10. Limitation of Liability",
    content:
      'To the maximum extent permitted by law, Logic Arena shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. The Service is provided "as is" without warranty of any kind.',
  },
  {
    title: "11. Governing Law",
    content:
      "These Terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration in accordance with the rules of the relevant arbitration authority in your jurisdiction.",
  },
];

export default function TermsPage() {
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
        {/* Back */}
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
              LEGAL_DOCUMENT
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] mb-4 uppercase">
              Terms of Service
            </h1>
            <div className="h-px w-full max-w-sm bg-gradient-to-r from-accent/50 to-transparent mb-4" />
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-accent/50">
              Last updated: <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.5)]">January 2026</span>
            </p>
          </div>
        </div>

        {/* Content */}
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
            Questions? <Link href="/contact" className="text-accent border-b border-accent/30 hover:border-accent hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)] pb-0.5 ml-2 transition-all">Contact us →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
