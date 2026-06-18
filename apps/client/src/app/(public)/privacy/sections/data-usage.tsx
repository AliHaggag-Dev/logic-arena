import { Database, Eye, KeyRound } from "lucide-react";
import { PublicBody, PublicDefinition, PublicSectionCard } from "@/components/PublicPageLayout";

export function DataUsage() {
  return (
    <>
      <PublicSectionCard id="information-we-collect" index={1} title="Information We Collect" icon={<Database size={16} />}>
        <div className="flex flex-col gap-5">
          <PublicBody>When you create a Logic Arena account, we collect the minimum data required to operate a competitive coding and multiplayer platform. This includes account data, gameplay data, replay data, preference data, and feedback data.</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}>
            <PublicDefinition term="Account Data">Your username, email address, custom uploaded avatars (processed securely via Cloudinary), and — when you authenticate via Google or GitHub — your public OAuth profile name. We do not collect passwords when you use OAuth. If you register with an email and password directly, your password is stored as a one-way bcrypt hash and is never readable by our team.</PublicDefinition>
            <PublicDefinition term="Platform Data">Match results, ELO rating history, AliScript program versions you submit, campaign progress, Black Market points, Garage cosmetic selections, and session metadata. This data is the engine of Logic Arena — it powers rankings, matchmaking, and replay systems.</PublicDefinition>
            <PublicDefinition term="Replay Data">Arena multiplayer matches may store replay snapshots and final scripts in PostgreSQL so you can review completed matches. Campaign fight replay frames are temporary in-memory review buffers for the current level attempt and are not persisted as database replay records.</PublicDefinition>
            <PublicDefinition term="Preferences & Social Data">We store arena preferences, notification settings, achievements, friend relationships, challenge state, and profile customization so those features work across devices.</PublicDefinition>
            <PublicDefinition term="Feedback Data">If you submit a contact message, bug report, or feature request, we store the form fields you provide so the admin team can triage, respond, and track status.</PublicDefinition>
          </div>
          <PublicBody>We do not collect payment information. Logic Arena does not currently offer paid subscriptions or in-app purchases.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="how-we-use-your-data" index={2} title="How We Use Your Data" icon={<Eye size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Every piece of data we collect serves a defined operational purpose. We do not monetise your data, and we do not sell it to advertisers. Your data is used exclusively for the following:</PublicBody>
          {[
            ["Platform Operation", "Running real-time multiplayer and campaign matches, maintaining persistent rankings, saving loadouts and settings, and delivering your campaign progress across sessions."],
            ["Skill-Based Matchmaking", "Calculating ELO deltas and pairing you against opponents of comparable ability. Without this data, competitive integrity is impossible."],
            ["Replay & Learning Tools", "Providing replay playback, post-match learning tools, achievements, and ARIA assistance based on platform documentation or selected match context."],
            ["Service Notifications", "Sending transactional emails such as email verification, security alerts, and critical service updates. Marketing emails are opt-in only."],
            ["Legal Compliance", "Meeting any obligations required by applicable law, such as responding to a valid legal request from a competent authority."],
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

      <PublicSectionCard id="oauth-authentication" index={3} title="OAuth Authentication" icon={<KeyRound size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena supports sign-in via Google and GitHub using OAuth 2.0. When you authenticate through either provider, you are redirected to their secure login page. We never see or handle your Google or GitHub password.</PublicBody>
          <PublicBody>Upon successful authentication, the OAuth provider issues us a signed token. We use this token solely to verify your identity and retrieve only the data scopes you explicitly authorised — typically your public display name, primary email address, and profile avatar. We do not request access to your repositories, contacts, calendar, or any private data.</PublicBody>
          <PublicBody>OAuth access tokens are stored encrypted and are rotated on each session. Refresh tokens, if issued, are stored in an HTTP-only, Secure, SameSite=Lax cookie that is inaccessible to JavaScript running in the browser.</PublicBody>
        </div>
      </PublicSectionCard>
    </>
  );
}
