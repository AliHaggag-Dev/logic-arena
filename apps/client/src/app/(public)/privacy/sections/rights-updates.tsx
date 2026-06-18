import Link from "next/link";
import { Scale, RefreshCw } from "lucide-react";
import { PublicBody, PublicDefinition, PublicSectionCard, PublicFooterCTA } from "@/components/PublicPageLayout";

export function RightsUpdates() {
  return (
    <>
      <PublicSectionCard id="your-rights" index={10} title="Your Rights" icon={<Scale size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Depending on your jurisdiction, you may hold a number of statutory rights over your personal data. We honour these rights regardless of whether you are located in a jurisdiction that legally mandates them.</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}>
            <PublicDefinition term="Right of Access">You may request a copy of all personal data we hold about you.</PublicDefinition>
            <PublicDefinition term="Right to Rectification">You may request correction of inaccurate or incomplete data. Many fields (username, avatar) can be updated directly in your account settings.</PublicDefinition>
            <PublicDefinition term="Right to Erasure">You may request deletion of your account and associated personal data. Match records and persisted arena replays may be anonymised, not deleted, to preserve platform integrity and replay history.</PublicDefinition>
            <PublicDefinition term="Right to Restriction">You may request that we restrict processing of your data while a dispute is being resolved.</PublicDefinition>
            <PublicDefinition term="Right to Portability">You may request an export of your account and match data in a structured, machine-readable format (JSON).</PublicDefinition>
            <PublicDefinition term="Right to Object">You may object to processing based on our legitimate interests, including analytics and communications not covered by your consent.</PublicDefinition>
          </div>
          <PublicBody>To exercise any of these rights, contact us via the{" "}
            <Link href="/contact" className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}>Contact page</Link>
            . We will respond within 30 days. No fee is charged for submitting a rights request.
          </PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="policy-changes" index={11} title="Changes to This Policy" icon={<RefreshCw size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>We may update this Privacy Policy as the platform evolves. When we make material changes — changes that meaningfully affect your rights or how we use your data — we will notify you by email and post a prominent notice in the platform for at least 14 days before the changes take effect.</PublicBody>
          <PublicBody>Continued use of Logic Arena after the effective date of a revised policy constitutes your acceptance of the updated terms. If you do not agree, you may delete your account before the changes take effect.</PublicBody>
          <PublicBody>Minor, non-material changes (such as clarifications or formatting updates) may be made without advance notice, but the &quot;Last updated&quot; date will always reflect the current revision.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicFooterCTA>
        Cookie questions?{" "}
        <Link href="/cookies" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.35)" }}>Read our Cookie Policy</Link>
        {" "}·{" "}
        <Link href="/contact" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.35)" }}>Contact our team</Link>
      </PublicFooterCTA>
    </>
  );
}
