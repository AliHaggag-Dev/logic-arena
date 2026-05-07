import type { Metadata } from "next";
import Link from "next/link";
import {
  Cookie,
  Database,
  Eye,
  FileText,
  Globe,
  Info,
  KeyRound,
  RefreshCw,
  Scale,
  Shield,
  UserCheck,
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
  title: "Privacy Policy — Logic Arena",
  description:
    "Understand exactly how Logic Arena collects, processes, and safeguards your personal data. We believe transparency is not optional — it is a competitive advantage.",
};

/* ─── Section manifest ──────────────────────────────────── */

const SECTIONS: PublicSection[] = [
  { id: "information-we-collect", title: "Information We Collect", label: "Data We Collect" },
  { id: "how-we-use-your-data", title: "How We Use Your Data", label: "Data Usage" },
  { id: "oauth-authentication", title: "OAuth Authentication", label: "OAuth / SSO" },
  { id: "network-technical-data", title: "Network & Technical Data", label: "Network Data" },
  { id: "data-sharing", title: "Data Sharing & Third Parties", label: "Third Parties" },
  { id: "data-retention", title: "Data Retention", label: "Retention" },
  { id: "cookies-tracking", title: "Cookies & Tracking", label: "Cookies" },
  { id: "security", title: "Security", label: "Security" },
  { id: "childrens-privacy", title: "Children's Privacy", label: "Children" },
  { id: "your-rights", title: "Your Rights", label: "Your Rights" },
  { id: "policy-changes", title: "Changes to This Policy", label: "Policy Updates" },
];

/* ─── Page ──────────────────────────────────────────────── */

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      badge="Legal Document"
      title="Privacy Policy"
      subtitle="We believe transparency is not optional — it is a competitive advantage. This document explains exactly what data we collect, why we collect it, and how we keep it secure."
      lastUpdated="May 2026"
      sections={SECTIONS}
    >

      {/* 01 — Information We Collect */}
      <PublicSectionCard
        id="information-we-collect"
        index={1}
        title="Information We Collect"
        icon={<Database size={16} />}
      >
        <div className="flex flex-col gap-5">
          <PublicBody>
            When you create a Logic Arena account, we collect the minimum data required to operate a competitive multiplayer platform. This falls into two categories:
          </PublicBody>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}
          >
            <PublicDefinition term="Account Data">
              Your username, email address, custom uploaded avatars (processed securely via Cloudinary), and — when you authenticate via Google or GitHub — your public OAuth profile name. We do not collect passwords when you use OAuth. If you register with an email and password directly, your password is stored as a one-way bcrypt hash and is never readable by our team.
            </PublicDefinition>
            <PublicDefinition term="Platform Data">
              Match results, ELO rating history, AliScript program versions you submit, campaign progress, Black Market points, Garage cosmetic selections, and session metadata. This data is the engine of Logic Arena — it powers rankings, matchmaking, and replay systems.
            </PublicDefinition>
            <PublicDefinition term="Usage Analytics">
              Aggregate, anonymised telemetry about feature engagement (e.g., which editor tools are used most). No individual user is identifiable in this data.
            </PublicDefinition>
          </div>
          <PublicBody>
            We do not collect payment information. Logic Arena does not currently offer paid subscriptions or in-app purchases.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 02 — How We Use Your Data */}
      <PublicSectionCard
        id="how-we-use-your-data"
        index={2}
        title="How We Use Your Data"
        icon={<Eye size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Every piece of data we collect serves a defined operational purpose. We do not monetise your data, and we do not sell it to advertisers. Your data is used exclusively for the following:
          </PublicBody>
          {[
            ["Platform Operation", "Running real-time multiplayer matches, maintaining persistent rankings, and delivering your campaign progress across sessions."],
            ["Skill-Based Matchmaking", "Calculating ELO deltas and pairing you against opponents of comparable ability. Without this data, competitive integrity is impossible."],
            ["Service Notifications", "Sending transactional emails such as email verification, security alerts, and critical service updates. Marketing emails are opt-in only."],
            ["Platform Improvement", "Analysing aggregate usage trends to prioritise development roadmap items. No individual is profiled for this purpose."],
            ["Legal Compliance", "Meeting any obligations required by applicable law, such as responding to a valid legal request from a competent authority."],
          ].map(([heading, body]) => (
            <div
              key={heading}
              className="flex gap-4 items-start py-3 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
              />
              <div>
                <p
                  className="text-[11px] font-black tracking-[0.2em] uppercase mb-1"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  {heading}
                </p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      {/* 03 — OAuth Authentication */}
      <PublicSectionCard
        id="oauth-authentication"
        index={3}
        title="OAuth Authentication"
        icon={<KeyRound size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Logic Arena supports sign-in via Google and GitHub using OAuth 2.0. When you authenticate through either provider, you are redirected to their secure login page. We never see or handle your Google or GitHub password.
          </PublicBody>
          <PublicBody>
            Upon successful authentication, the OAuth provider issues us a signed token. We use this token solely to verify your identity and retrieve only the data scopes you explicitly authorised — typically your public display name, primary email address, and profile avatar. We do not request access to your repositories, contacts, calendar, or any private data.
          </PublicBody>
          <PublicBody>
            OAuth access tokens are stored encrypted and are rotated on each session. Refresh tokens, if issued, are stored in an HTTP-only, Secure, SameSite=Lax cookie that is inaccessible to JavaScript running in the browser.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 04 — Network & Technical Data */}
      <PublicSectionCard
        id="network-technical-data"
        index={4}
        title="Network & Technical Data"
        icon={<Globe size={16} />}
      >
        <div className="flex flex-col gap-4">
          <div
            className="flex gap-3 items-start p-4 rounded-xl"
            style={{
              background: "rgba(var(--sem-warning-rgb, 245, 158, 11), 0.07)",
              border: "1px solid rgba(var(--sem-warning-rgb, 245, 158, 11), 0.2)",
            }}
          >
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: "var(--sem-warning, #f59e0b)" }} />
            <p
              className="text-[12px] leading-[1.8]"
              style={{ color: "rgba(var(--sem-warning-rgb, 245, 158, 11), 0.8)", fontFamily: "var(--font-mono)" }}
            >
              <strong>Transparency notice:</strong> As a real-time multiplayer platform powered by WebSocket connections, we necessarily process your IP address and device metadata to route game traffic. This section explains exactly what that means.
            </p>
          </div>
          <PublicBody>
            When your browser establishes a WebSocket connection to our game servers, our infrastructure logs your IP address, connection timestamp, and basic client metadata (browser engine, OS family) for the following operational purposes:
          </PublicBody>
          {[
            ["Latency Routing", "Directing your connection to the nearest server region to minimise match ping."],
            ["DDoS Mitigation", "Detecting and rate-limiting abusive connection patterns that would degrade the experience for all players."],
            ["Fraud & Abuse Prevention", "Identifying multi-account patterns, ban evasion attempts, and bot traffic."],
            ["Server Diagnostics", "Debugging disconnect events, packet loss anomalies, and infrastructure failures."],
          ].map(([heading, body]) => (
            <div
              key={heading}
              className="flex gap-4 items-start py-3 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
              />
              <div>
                <p
                  className="text-[11px] font-black tracking-[0.2em] uppercase mb-1"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  {heading}
                </p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
          <PublicBody>
            Raw connection logs containing IP addresses are retained for a maximum of 30 days before automatic deletion, unless a security event requires extended retention for investigation.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 05 — Data Sharing */}
      <PublicSectionCard
        id="data-sharing"
        index={5}
        title="Data Sharing & Third Parties"
        icon={<UserCheck size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            We do not sell, rent, or trade your personal data. Full stop. The following are the only circumstances under which your data may leave our direct control:
          </PublicBody>
          {[
            ["Infrastructure Providers", "We host on cloud infrastructure providers (such as a managed Kubernetes or VPS provider). These providers process data on our behalf under strict Data Processing Agreements (DPAs) and may not use your data for any other purpose."],
            ["Legal Obligations", "We may disclose data when compelled by a valid legal order from a competent authority (e.g., court order, government subpoena). We will notify affected users to the extent legally permitted."],
            ["Safety Emergencies", "In rare circumstances where there is a credible, immediate threat to the safety of a person, we may disclose the minimum necessary data to the appropriate authorities."],
            ["Business Transfers", "In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity. We will notify you via email and provide a 30-day window to request deletion before any transfer is completed."],
          ].map(([heading, body]) => (
            <div
              key={heading}
              className="flex gap-4 items-start py-3 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
              />
              <div>
                <p
                  className="text-[11px] font-black tracking-[0.2em] uppercase mb-1"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  {heading}
                </p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      {/* 06 — Data Retention */}
      <PublicSectionCard
        id="data-retention"
        index={6}
        title="Data Retention"
        icon={<Database size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            We retain your data only as long as necessary to fulfil the purpose for which it was collected, or as required by law.
          </PublicBody>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}
          >
            <PublicDefinition term="Active Account">
              All account data and platform data is retained for the lifetime of your account.
            </PublicDefinition>
            <PublicDefinition term="Deleted Account">
              Upon account deletion, all personally identifiable information (name, email, OAuth identifiers) is purged within 30 days. This is irreversible.
            </PublicDefinition>
            <PublicDefinition term="Match Records">
              Anonymised match records and aggregate statistics (e.g., total matches played, ELO distribution) may be retained indefinitely for platform integrity and historical leaderboard purposes. These records cannot be linked back to you after account deletion.
            </PublicDefinition>
            <PublicDefinition term="Connection Logs">
              Raw server logs containing IP addresses are purged after 30 days. Aggregated abuse-detection signals may be retained longer in anonymised form.
            </PublicDefinition>
          </div>
        </div>
      </PublicSectionCard>

      {/* 07 — Cookies & Tracking */}
      <PublicSectionCard
        id="cookies-tracking"
        index={7}
        title="Cookies & Tracking"
        icon={<Cookie size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            We use the minimum set of cookies required to operate the platform securely and respect your preferences. With your consent, we may additionally use analytics cookies.
          </PublicBody>
          <PublicBody>
            See our full{" "}
            <Link
              href="/cookies"
              className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
              style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}
            >
              Cookie Policy
            </Link>{" "}
            for a complete breakdown of every cookie we set, its purpose, and its lifespan.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 08 — Security */}
      <PublicSectionCard
        id="security"
        index={8}
        title="Security"
        icon={<Shield size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Security is not an afterthought at Logic Arena — it is a core design requirement. We implement the following measures to protect your data:
          </PublicBody>
          {[
            ["Encryption in Transit", "All communication between your browser and our servers is encrypted using TLS 1.2+. WebSocket connections use WSS (WebSocket Secure)."],
            ["Encryption at Rest", "Sensitive fields in our database are encrypted at the column level. Passwords are hashed with bcrypt (cost factor 12+) and are never stored in plain text."],
            ["Access Controls", "Production database access is restricted to a minimal set of backend services operating under least-privilege principles. No human can query raw user data without an audited approval workflow."],
            ["Infrastructure Hardening", "Our servers do not expose unnecessary ports. SSH access is key-only and MFA-protected. All infrastructure changes are deployed through a CI/CD pipeline with mandatory review gates."],
          ].map(([heading, body]) => (
            <div
              key={heading}
              className="flex gap-4 items-start py-3 border-b last:border-0"
              style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}
            >
              <div
                className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
              />
              <div>
                <p
                  className="text-[11px] font-black tracking-[0.2em] uppercase mb-1"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  {heading}
                </p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
          <PublicBody>
            No system connected to the internet can guarantee absolute security. We encourage you to use a strong, unique password (or OAuth), and to contact us immediately at the address on our{" "}
            <Link
              href="/contact"
              className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
              style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}
            >
              Contact page
            </Link>{" "}
            if you discover a potential security vulnerability.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 09 — Children's Privacy */}
      <PublicSectionCard
        id="childrens-privacy"
        index={9}
        title="Children's Privacy"
        icon={<UserCheck size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Logic Arena is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you are under 13, you may not create an account or use the platform.
          </PublicBody>
          <PublicBody>
            If you are a parent or guardian and believe that your child has provided us with personal data without your consent, please contact us immediately via our{" "}
            <Link
              href="/contact"
              className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
              style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}
            >
              Contact page
            </Link>
            . We will investigate and delete the data promptly.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 10 — Your Rights */}
      <PublicSectionCard
        id="your-rights"
        index={10}
        title="Your Rights"
        icon={<Scale size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            Depending on your jurisdiction, you may hold a number of statutory rights over your personal data. We honour these rights regardless of whether you are located in a jurisdiction that legally mandates them.
          </PublicBody>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}
          >
            <PublicDefinition term="Right of Access">
              You may request a copy of all personal data we hold about you.
            </PublicDefinition>
            <PublicDefinition term="Right to Rectification">
              You may request correction of inaccurate or incomplete data. Many fields (username, avatar) can be updated directly in your account settings.
            </PublicDefinition>
            <PublicDefinition term="Right to Erasure">
              You may request deletion of your account and associated personal data. Match records will be anonymised, not deleted, to preserve platform integrity.
            </PublicDefinition>
            <PublicDefinition term="Right to Restriction">
              You may request that we restrict processing of your data while a dispute is being resolved.
            </PublicDefinition>
            <PublicDefinition term="Right to Portability">
              You may request an export of your account and match data in a structured, machine-readable format (JSON).
            </PublicDefinition>
            <PublicDefinition term="Right to Object">
              You may object to processing based on our legitimate interests, including analytics and communications not covered by your consent.
            </PublicDefinition>
          </div>
          <PublicBody>
            To exercise any of these rights, contact us via the{" "}
            <Link
              href="/contact"
              className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
              style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}
            >
              Contact page
            </Link>
            . We will respond within 30 days. No fee is charged for submitting a rights request.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* 11 — Policy Changes */}
      <PublicSectionCard
        id="policy-changes"
        index={11}
        title="Changes to This Policy"
        icon={<RefreshCw size={16} />}
      >
        <div className="flex flex-col gap-4">
          <PublicBody>
            We may update this Privacy Policy as the platform evolves. When we make material changes — changes that meaningfully affect your rights or how we use your data — we will notify you by email and post a prominent notice in the platform for at least 14 days before the changes take effect.
          </PublicBody>
          <PublicBody>
            Continued use of Logic Arena after the effective date of a revised policy constitutes your acceptance of the updated terms. If you do not agree, you may delete your account before the changes take effect.
          </PublicBody>
          <PublicBody>
            Minor, non-material changes (such as clarifications or formatting updates) may be made without advance notice, but the &quot;Last updated&quot; date will always reflect the current revision.
          </PublicBody>
        </div>
      </PublicSectionCard>

      {/* Footer CTA */}
      <PublicFooterCTA>
        Cookie questions?{" "}
        <Link
          href="/cookies"
          className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
          style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.35)" }}
        >
          Read our Cookie Policy
        </Link>
        {" "}·{" "}
        <Link
          href="/contact"
          className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90"
          style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.35)" }}
        >
          Contact our team
        </Link>
      </PublicFooterCTA>

    </PublicPageLayout>
  );
}
