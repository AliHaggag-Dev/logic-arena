import { Globe, Info, UserCheck, Database } from "lucide-react";
import { PublicBody, PublicDefinition, PublicSectionCard } from "@/components/PublicPageLayout";

export function NetworkRetention() {
  return (
    <>
      <PublicSectionCard id="network-technical-data" index={4} title="Network & Technical Data" icon={<Globe size={16} />}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-start p-4 rounded-xl" style={{ background: "rgba(var(--sem-warning-rgb, 245, 158, 11), 0.07)", border: "1px solid rgba(var(--sem-warning-rgb, 245, 158, 11), 0.2)" }}>
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: "var(--sem-warning, #f59e0b)" }} />
            <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(var(--sem-warning-rgb, 245, 158, 11), 0.8)", fontFamily: "var(--font-mono)" }}>
              <strong>Transparency notice:</strong> As a real-time multiplayer platform powered by WebSocket connections, we necessarily process your IP address and device metadata to route game traffic. This section explains exactly what that means.
            </p>
          </div>
          <PublicBody>When your browser establishes a WebSocket connection to our game servers, our infrastructure logs your IP address, connection timestamp, and basic client metadata (browser engine, OS family) for the following operational purposes:</PublicBody>
          {[
            ["Latency Routing", "Directing your connection to the nearest server region to minimise match ping."],
            ["DDoS Mitigation", "Detecting and rate-limiting abusive connection patterns that would degrade the experience for all players."],
            ["Fraud & Abuse Prevention", "Identifying multi-account patterns, ban evasion attempts, and bot traffic."],
            ["Server Diagnostics", "Debugging disconnect events, packet loss anomalies, and infrastructure failures."],
          ].map(([heading, body]) => (
            <div key={heading} className="flex gap-4 items-start py-3 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{heading}</p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
          <PublicBody>Raw connection logs containing IP addresses are retained for a maximum of 30 days before automatic deletion, unless a security event requires extended retention for investigation.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="data-sharing" index={5} title="Data Sharing & Third Parties" icon={<UserCheck size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>We do not sell, rent, or trade your personal data. Full stop. The following are the only circumstances under which your data may leave our direct control:</PublicBody>
          {[
            ["Infrastructure Providers", "We host application data in PostgreSQL through Prisma ORM, use Redis for sessions, rate limits, presence, replay cache, and short-lived campaign tokens, and run the application on managed cloud infrastructure. These providers process data on our behalf and may not use it for unrelated purposes."],
            ["Avatar & Email Providers", "Cloudinary processes uploaded avatar images. Email infrastructure is used for verification, password reset, and service notifications."],
            ["OAuth Providers", "Google and GitHub process sign-in flows when you choose OAuth. We receive only the profile fields needed to create or authenticate your account."],
            ["Analytics Provider", "Google Analytics may receive page-view and device/browser telemetry from public and application pages. We use this to understand aggregate product usage and performance, not to sell advertising profiles."],
            ["AI Assistance", "ARIA documentation and tutor features may use Google's Gemini API for retrieval, embeddings, or answer generation. Do not submit secrets, credentials, or sensitive personal data into AI prompts or uploaded analysis inputs."],
            ["Legal Obligations", "We may disclose data when compelled by a valid legal order from a competent authority (e.g., court order, government subpoena). We will notify affected users to the extent legally permitted."],
            ["Safety Emergencies", "In rare circumstances where there is a credible, immediate threat to the safety of a person, we may disclose the minimum necessary data to the appropriate authorities."],
            ["Business Transfers", "In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity. We will notify you via email and provide a 30-day window to request deletion before any transfer is completed."],
          ].map(([heading, body]) => (
            <div key={heading} className="flex gap-4 items-start py-3 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{heading}</p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="data-retention" index={6} title="Data Retention" icon={<Database size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>We retain your data only as long as necessary to fulfil the purpose for which it was collected, or as required by law.</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}>
            <PublicDefinition term="Active Account">All account data and platform data is retained for the lifetime of your account.</PublicDefinition>
            <PublicDefinition term="Deleted Account">Upon account deletion, all personally identifiable information (name, email, OAuth identifiers) is purged within 30 days. This is irreversible.</PublicDefinition>
            <PublicDefinition term="Match Records">Anonymised match records, persisted arena replay snapshots, and aggregate statistics (e.g., total matches played, ELO distribution) may be retained indefinitely for platform integrity, replay learning, and historical leaderboard purposes. These records cannot be linked back to you after account deletion.</PublicDefinition>
            <PublicDefinition term="Campaign Replay Buffers">Campaign replay controls use temporary in-memory frames for the active level attempt. These buffers are discarded when the session ends or the page is left and are not stored as persistent replay records.</PublicDefinition>
            <PublicDefinition term="Feedback Records">Contact messages, bug reports, and feature requests are retained while they remain useful for support, moderation, product planning, or security investigation.</PublicDefinition>
            <PublicDefinition term="Connection Logs">Raw server logs containing IP addresses are purged after 30 days. Aggregated abuse-detection signals may be retained longer in anonymised form.</PublicDefinition>
          </div>
        </div>
      </PublicSectionCard>
    </>
  );
}
