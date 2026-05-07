import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  BookOpen,
  Briefcase,
  Crown,
  FileText,
  Gavel,
  RefreshCw,
  Scale,
  Shield,
  Swords,
  UserCheck,
  Wifi,
  Zap,
} from "lucide-react";

import PublicPageLayout, {
  PublicBody,
  PublicDefinition,
  PublicFooterCTA,
  PublicSectionCard,
  type PublicSection,
} from "@/components/PublicPageLayout";

/* ─── Metadata ──────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Terms of Service — Logic Arena",
  description:
    "The Terms of Service that govern your access to and use of the Logic Arena platform. By competing, you agree to uphold these standards.",
};

/* ─── Section manifest ──────────────────────────────────── */

const SECTIONS: PublicSection[] = [
  { id: "acceptance", title: "Acceptance of Terms", label: "Acceptance" },
  { id: "eligibility", title: "Account Eligibility", label: "Eligibility" },
  { id: "permitted-use", title: "Permitted Use", label: "Permitted Use" },
  { id: "user-content", title: "User-Generated Content", label: "Your Content" },
  { id: "prohibited-conduct", title: "Prohibited Conduct", label: "Prohibited Conduct" },
  { id: "competitive-integrity", title: "Competitive Integrity", label: "Integrity" },
  { id: "service-availability", title: "Service Availability", label: "Availability" },
  { id: "intellectual-property", title: "Intellectual Property", label: "IP Rights" },
  { id: "termination", title: "Termination", label: "Termination" },
  { id: "limitation-of-liability", title: "Limitation of Liability", label: "Liability" },
  { id: "governing-law", title: "Governing Law", label: "Governing Law" },
];

/* ─── Page ──────────────────────────────────────────────── */

export default function TermsPage() {
  return (
    <PublicPageLayout
      badge="Legal Document"
      title="Terms of Service"
      subtitle="These are the rules of the Arena. By accessing or using Logic Arena, you agree to be bound by these Terms. Read them. Know them. They exist to protect everyone — including you."
      lastUpdated="May 2026"
      sections={SECTIONS}
    >

      {/* 01 — Acceptance */}
      <PublicSectionCard
        id="acceptance"
        index={1}
        title="Acceptance of Terms"
        icon={<FileText size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            By accessing, browsing, or using Logic Arena — including registering an account, writing AliScript programs, or participating in any competitive match — you confirm that you have read, understood, and agree to be legally bound by these Terms of Service and our{" "}
            <Link
              href="/privacy"
              className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
              style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}
            >
              Privacy Policy
            </Link>
            .
          </PublicBody>
          <PublicBody>
            If you do not agree to these Terms in their entirety, you must immediately cease using the platform and, if applicable, delete your account.
          </PublicBody>
          <PublicBody>
            Logic Arena reserves the right to revise these Terms at any time. When material changes are made, we will notify you via email and through an in-platform notice no fewer than 14 days before the changes take effect. Continued use of the Service after the effective date constitutes acceptance of the revised Terms.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 02 — Eligibility */}
      <PublicSectionCard
        id="eligibility"
        index={2}
        title="Account Eligibility"
        icon={<UserCheck size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            To create an account and use Logic Arena, you must meet the following requirements:
          </PublicBody>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}
          >
            <PublicDefinition term="Age">
              You must be at least 13 years of age. If you are under 18, you represent that you have obtained parental or guardian consent to use the platform.
            </PublicDefinition>
            <PublicDefinition term="Authority">
              You have the legal capacity and authority to enter into a binding agreement in your jurisdiction.
            </PublicDefinition>
            <PublicDefinition term="Accuracy">
              All information you provide during registration is accurate, complete, and current. You agree to maintain the accuracy of this information over time.
            </PublicDefinition>
            <PublicDefinition term="Account Security">
              You are solely responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account, whether or not authorised by you.
            </PublicDefinition>
          </div>
          <PublicBody>
            You may hold only one Logic Arena account per person. Creating multiple accounts is a violation of these Terms and may result in immediate suspension of all associated accounts.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 03 — Permitted Use */}
      <PublicSectionCard
        id="permitted-use"
        index={3}
        title="Permitted Use"
        icon={<BookOpen size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Logic Arena grants you a limited, personal, non-exclusive, non-transferable, revocable licence to access and use the platform for its intended purpose: competitive programming, robot combat simulation, and skill development.
          </PublicBody>
          <PublicBody>
            Within this licence, you are permitted to:
          </PublicBody>
          {[
            "Write, test, and submit AliScript programs to control virtual robots in competitive and campaign modes.",
            "Participate in ranked matches, Campaigns, or Tournaments against other users.",
            "Watch live matches via Spectator Mode and interact with the Black Market economy.",
            "Access and read platform documentation, patch notes, and community resources.",
            "Share match replays and your AliScript programs with other users for educational or community purposes.",
            "Report bugs and submit feature requests through official channels.",
          ].map((item) => (
            <div
              key={item}
              className="flex gap-3 items-start py-2.5 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--sem-success, #22c55e)", boxShadow: "0 0 6px var(--sem-success, #22c55e)" }}
              />
              <PublicBody>{item}</PublicBody>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      {/* 04 — User Content */}
      <PublicSectionCard
        id="user-content"
        index={4}
        title="User-Generated Content"
        icon={<Briefcase size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Logic Arena is a creation platform at its core. Everything you build here — your programs, your strategies — belongs to you. These terms clarify how that works in practice.
          </PublicBody>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}
          >
            <PublicDefinition term="Your Ownership">
              All AliScript programs, scripts, and strategies you create and submit to Logic Arena remain your intellectual property. We make no claim of ownership over your creative work.
            </PublicDefinition>
            <PublicDefinition term="Platform Licence">
              By submitting content to the platform, you grant Logic Arena a non-exclusive, worldwide, royalty-free licence to host, store, process, display, and transmit that content for the sole purpose of operating and delivering the Service. This licence terminates when you delete the content or your account.
            </PublicDefinition>
            <PublicDefinition term="Your Responsibility">
              You represent and warrant that any content you submit does not infringe on the intellectual property rights of any third party and does not contain malicious code, exploits, or anything designed to harm the platform or other users.
            </PublicDefinition>
          </div>
        </div>
      </PublicSectionCard>

      {/* 05 — Prohibited Conduct */}
      <PublicSectionCard
        id="prohibited-conduct"
        index={5}
        title="Prohibited Conduct"
        icon={<Ban size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            The Arena is built on fair competition and mutual respect. The following conduct is strictly prohibited and will result in disciplinary action up to and including permanent account termination:
          </PublicBody>
          {[
            ["Sandbox & Quota Exploitation", "Attempting to circumvent the AliScript execution sandbox or maliciously evade Time Limit Exceeded (TLE) quotas to degrade server performance."],
            ["Economy Manipulation", "Exploiting bugs to generate infinite Black Market points, duplicate items, or manipulate Garage cosmetic loadouts."],
            ["Platform Sabotage", "Submitting code intentionally designed to cause server crashes or memory exhaustion."],
            ["Vulnerability Exploitation", "Exploiting bugs, security vulnerabilities, or unintended mechanics for competitive advantage without first reporting them through our responsible disclosure process."],
            ["Harassment & Toxicity", "Engaging in harassment, hate speech, threats, or any abusive behaviour toward other users in any platform communication channel."],
            ["Multi-Accounting", "Creating or using multiple accounts to exploit matchmaking, manipulate rankings, or circumvent suspensions."],
            ["Automation & Botting", "Using scripts, bots, or automated tools to interact with the platform outside of the AliScript engine in ways not sanctioned by the API."],
            ["Impersonation", "Impersonating Logic Arena staff, moderators, or other users."],
          ].map(([heading, body]) => (
            <div
              key={heading}
              className="flex gap-4 items-start py-3 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--sem-danger, #ef4444)", boxShadow: "0 0 6px var(--sem-danger, #ef4444)" }}
              />
              <div>
                <p
                  className="text-[11px] font-black tracking-[0.2em] uppercase mb-1"
                  style={{ color: "var(--sem-danger, #ef4444)", fontFamily: "var(--font-mono)" }}
                >
                  {heading}
                </p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      {/* 06 — Competitive Integrity */}
      <PublicSectionCard
        id="competitive-integrity"
        index={6}
        title="Competitive Integrity"
        icon={<Swords size={16} />}
      >
        <div className="flex flex-col gap-4">
          <div
            className="flex gap-3 items-start p-4 rounded-xl"
            style={{
              background: "rgba(var(--accent-rgb), 0.06)",
              border: "1px solid rgba(var(--accent-rgb), 0.2)",
            }}
          >
            <Crown size={14} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <p
              className="text-[12px] leading-[1.8]"
              style={{ color: "rgba(var(--accent-rgb), 0.8)", fontFamily: "var(--font-mono)" }}
            >
              Competitive integrity is non-negotiable at Logic Arena. Every ranked match result is final once committed to the ledger by our deterministic battle engine.
            </p>
          </div>
          <PublicBody>
            Logic Arena operates a deterministic, sandboxed combat engine. Match outcomes are computed server-side and are immutable once recorded. There is no mechanism to appeal or reverse a legitimate match result.
          </PublicBody>
          <PublicBody>
            Any attempt to manipulate match outcomes through external means — including collusion with opponents, coordinated ranking farming, exploitation of engine bugs, or interference with server processes — constitutes a severe violation of these Terms. Confirmed violations will result in:
          </PublicBody>
          {[
            "Immediate suspension of the offending account(s).",
            "Removal of all affected match records and ELO adjustments.",
            "Permanent exclusion from ranked ladders and tournament brackets.",
            "Where applicable, escalation to relevant legal authorities.",
          ].map((item) => (
            <div
              key={item}
              className="flex gap-3 items-start py-2.5 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <AlertTriangle
                size={12}
                className="shrink-0 mt-1"
                style={{ color: "var(--sem-warning, #f59e0b)" }}
              />
              <PublicBody>{item}</PublicBody>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      {/* 07 — Service Availability */}
      <PublicSectionCard
        id="service-availability"
        index={7}
        title="Service Availability"
        icon={<Wifi size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Logic Arena targets 99.9% uptime across our game server infrastructure. However, we do not guarantee uninterrupted, error-free access to the Service.
          </PublicBody>
          <PublicBody>
            Scheduled maintenance windows will be announced at least 24 hours in advance via in-platform notifications and our status page. Emergency maintenance may be performed without advance notice when required to protect the integrity or security of the platform.
          </PublicBody>
          <PublicBody>
            Logic Arena is not liable for any losses, data corruption, or ELO changes arising directly from unplanned service interruptions, provided we act in good faith to restore service promptly.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 08 — Intellectual Property */}
      <PublicSectionCard
        id="intellectual-property"
        index={8}
        title="Intellectual Property"
        icon={<Crown size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            All platform assets not created by users — including but not limited to the Logic Arena name and brand, the AliScript language specification and parser, the battle engine, all UI designs, robot models, visual effects, sound assets, and documentation — are the exclusive intellectual property of Logic Arena and its licensors.
          </PublicBody>
          <PublicBody>
            These assets are protected by copyright, trademark, and other applicable intellectual property laws. Nothing in these Terms grants you any right, title, or interest in Logic Arena&apos;s intellectual property beyond the limited usage licence described in Section 3.
          </PublicBody>
          <PublicBody>
            You may not copy, modify, distribute, sell, or create derivative works based on Logic Arena&apos;s intellectual property without our prior written consent.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 09 — Termination */}
      <PublicSectionCard
        id="termination"
        index={9}
        title="Termination"
        icon={<Zap size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Logic Arena may suspend or permanently terminate your account at any time, for any reason, with or without prior notice. Grounds for termination include, but are not limited to, violation of these Terms, conduct harmful to other users or the platform, or requests from law enforcement.
          </PublicBody>
          <PublicBody>
            You may also voluntarily terminate your account at any time by navigating to your account settings. Upon termination of your account:
          </PublicBody>
          {[
            "Your access to the platform and all its features will be revoked immediately.",
            "Your personally identifiable information will be deleted within 30 days (see our Privacy Policy).",
            "Your AliScript programs, match history, and ELO data will be anonymised and may be retained in aggregate form.",
            "The usage licence you granted to Logic Arena for your submitted content will terminate.",
          ].map((item, i) => (
            <div
              key={i}
              className="flex gap-3 items-start py-2.5 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
              />
              <PublicBody>{item}</PublicBody>
            </div>
          ))}
          <PublicBody>
            Sections 4 (User-Generated Content licensing terms that survive termination), 8 (Intellectual Property), and 10 (Limitation of Liability) survive termination and remain binding.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 10 — Limitation of Liability */}
      <PublicSectionCard
        id="limitation-of-liability"
        index={10}
        title="Limitation of Liability"
        icon={<Scale size={16} />}
      >
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}
          >
            <PublicDefinition term="As-Is Service">
              The Logic Arena platform is provided &quot;as is&quot; and &quot;as available&quot; without any warranty of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </PublicDefinition>
            <PublicDefinition term="Liability Cap">
              To the maximum extent permitted by applicable law, Logic Arena&apos;s total cumulative liability to you for any claims arising from or relating to these Terms or the Service shall not exceed the greater of: (a) the amount you paid to Logic Arena in the 12 months preceding the claim, or (b) USD $100.
            </PublicDefinition>
            <PublicDefinition term="Exclusions">
              Logic Arena shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, loss of data, loss of ELO rating, or loss of goodwill — even if we have been advised of the possibility of such damages.
            </PublicDefinition>
          </div>
          <PublicBody>
            Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages. In such jurisdictions, our liability is limited to the fullest extent permitted by applicable law.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 11 — Governing Law */}
      <PublicSectionCard
        id="governing-law"
        index={11}
        title="Governing Law"
        icon={<Gavel size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            These Terms of Service are governed by and construed in accordance with applicable law. In the event of a dispute arising out of or relating to these Terms or the Service, both parties agree to first attempt resolution through good-faith negotiation.
          </PublicBody>
          <PublicBody>
            If informal resolution is not achieved within 30 days, the dispute shall be resolved through binding arbitration in accordance with the rules of a recognised arbitration body in your jurisdiction. Class action lawsuits and class-wide arbitration are expressly waived to the fullest extent permitted by law.
          </PublicBody>
          <PublicBody>
            If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* Footer CTA */}
      <PublicFooterCTA>
        Questions about these terms?{" "}
        <Link
          href="/contact"
          className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
          style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.35)" }}
        >
          Contact our team
        </Link>
        {" "}·{" "}
        <Link
          href="/privacy"
          className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
          style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.35)" }}
        >
          Read our Privacy Policy
        </Link>
      </PublicFooterCTA>

    </PublicPageLayout>
  );
}
