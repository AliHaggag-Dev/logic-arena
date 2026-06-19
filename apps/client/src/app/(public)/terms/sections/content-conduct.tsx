import { Briefcase, Ban, Swords, AlertTriangle, Crown } from "lucide-react";
import { PublicBody, PublicSectionCard } from "@/components/PublicPageLayout";

export function ContentConduct() {
  return (
    <>
      <PublicSectionCard id="user-content" index={4} title="User-Generated Content" icon={<Briefcase size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena is a creation platform at its core. Everything you build here — your programs, your strategies — belongs to you. These terms clarify how that works in practice.</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}>
            <PublicBody><strong>Your Ownership:</strong> All AliScript programs, scripts, and strategies you create and submit to Logic Arena remain your intellectual property. We make no claim of ownership over your creative work.</PublicBody>
            <PublicBody><strong>Platform Licence:</strong> By submitting content to the platform, you grant Logic Arena a non-exclusive, worldwide, royalty-free licence to host, store, process, display, and transmit that content for the sole purpose of operating and delivering the Service, including match execution, persisted arena replay playback, rankings, and learning features. This licence terminates when you delete the content or your account, except for anonymised records retained for platform integrity.</PublicBody>
            <PublicBody><strong>Your Responsibility:</strong> You represent and warrant that any content you submit does not infringe on the intellectual property rights of any third party and does not contain malicious code, exploits, or anything designed to harm the platform or other users.</PublicBody>
          </div>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="prohibited-conduct" index={5} title="Prohibited Conduct" icon={<Ban size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>The Arena is built on fair competition and mutual respect. The following conduct is strictly prohibited and will result in disciplinary action up to and including permanent account termination:</PublicBody>
          {[
            ["Sandbox & Quota Exploitation", "Attempting to circumvent the AliScript execution sandbox or maliciously evade Time Limit Exceeded (TLE) quotas to degrade server performance."],
            ["Economy Manipulation", "Exploiting bugs to generate infinite Black Market points, duplicate items, manipulate Garage cosmetic loadouts, or falsify Practice vs AI reward conditions."],
            ["Platform Sabotage", "Submitting code intentionally designed to cause server crashes or memory exhaustion."],
            ["Vulnerability Exploitation", "Exploiting bugs, security vulnerabilities, or unintended mechanics for competitive advantage without first reporting them through our responsible disclosure process."],
            ["Pause, Replay & AI Reward Abuse", "Attempting to use campaign-only pause/resume, replay controls, AI difficulty parameters, guest-only statistics, or client-side timing manipulation to alter multiplayer outcomes, farm rewards, or falsify match state."],
            ["Harassment & Toxicity", "Engaging in harassment, hate speech, threats, or any abusive behaviour toward other users in any platform communication channel."],
            ["Multi-Accounting", "Creating or using multiple accounts to exploit matchmaking, manipulate rankings, or circumvent suspensions."],
            ["Automation & Botting", "Using scripts, bots, or automated tools to interact with the platform outside of the AliScript engine in ways not sanctioned by the API."],
            ["Impersonation", "Impersonating Logic Arena staff, moderators, or other users."],
          ].map(([heading, body]) => (
            <div key={heading} className="flex gap-4 items-start py-3 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--sem-danger, #ef4444)", boxShadow: "0 0 6px var(--sem-danger, #ef4444)" }} />
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: "var(--sem-danger, #ef4444)", fontFamily: "var(--font-mono)" }}>{heading}</p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="competitive-integrity" index={6} title="Competitive Integrity" icon={<Swords size={16} />}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-start p-4 rounded-xl" style={{ background: "rgba(var(--accent-rgb), 0.06)", border: "1px solid rgba(var(--accent-rgb), 0.2)" }}>
            <Crown size={14} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(var(--accent-rgb), 0.8)", fontFamily: "var(--font-mono)" }}>Competitive integrity is non-negotiable at Logic Arena. Every ranked match result is final once committed to the ledger by our deterministic battle engine.</p>
          </div>
          <PublicBody>Logic Arena operates a deterministic, sandboxed combat engine. Match outcomes are computed server-side and are immutable once recorded. Campaign pause/resume is available only for campaign fights; it is not a multiplayer pause feature and does not alter arena match results. Replay controls are review tools, not appeal tools. Practice vs AI rewards are server-authoritative, require an authenticated difficulty-tagged AI match, and are not granted for guest sessions or generic solo tests.</PublicBody>
          <PublicBody>Any attempt to manipulate match outcomes through external means — including collusion with opponents, coordinated ranking farming, exploitation of engine bugs, or interference with server processes — constitutes a severe violation of these Terms. Confirmed violations will result in:</PublicBody>
          {[
            "Immediate suspension of the offending account(s).",
            "Removal of all affected match records and ELO adjustments.",
            "Permanent exclusion from ranked ladders and tournament brackets.",
            "Where applicable, escalation to relevant legal authorities.",
          ].map((item) => (
            <div key={item} className="flex gap-3 items-start py-2.5 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <AlertTriangle size={12} className="shrink-0 mt-1" style={{ color: "var(--sem-warning, #f59e0b)" }} />
              <PublicBody>{item}</PublicBody>
            </div>
          ))}
        </div>
      </PublicSectionCard>
    </>
  );
}
