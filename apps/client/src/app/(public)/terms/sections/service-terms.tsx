import { Wifi, Crown, Zap } from "lucide-react";
import { PublicBody, PublicSectionCard } from "@/components/PublicPageLayout";

export function ServiceTerms() {
  return (
    <>
      <PublicSectionCard id="service-availability" index={7} title="Service Availability" icon={<Wifi size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena targets 99.9% uptime across our game server infrastructure. However, we do not guarantee uninterrupted, error-free access to the Service.</PublicBody>
          <PublicBody>Scheduled maintenance windows will be announced at least 24 hours in advance via in-platform notifications and our status page. Emergency maintenance may be performed without advance notice when required to protect the integrity or security of the platform.</PublicBody>
          <PublicBody>Logic Arena is not liable for any losses, data corruption, or ELO changes arising directly from unplanned service interruptions, provided we act in good faith to restore service promptly.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="intellectual-property" index={8} title="Intellectual Property" icon={<Crown size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>All platform assets not created by users — including but not limited to the Logic Arena name and brand, the AliScript language specification and parser, the battle engine, all UI designs, robot models, visual effects, sound assets, and documentation — are the exclusive intellectual property of Logic Arena and its licensors.</PublicBody>
          <PublicBody>These assets are protected by copyright, trademark, and other applicable intellectual property laws. Nothing in these Terms grants you any right, title, or interest in Logic Arena&apos;s intellectual property beyond the limited usage licence described in Section 3.</PublicBody>
          <PublicBody>You may not copy, modify, distribute, sell, or create derivative works based on Logic Arena&apos;s intellectual property without our prior written consent.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="termination" index={9} title="Termination" icon={<Zap size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena may suspend or permanently terminate your account at any time, for any reason, with or without prior notice. Grounds for termination include, but are not limited to, violation of these Terms, conduct harmful to other users or the platform, or requests from law enforcement.</PublicBody>
          <PublicBody>You may also voluntarily terminate your account at any time by navigating to your account settings. Upon termination of your account:</PublicBody>
          {[
            "Your access to the platform and all its features will be revoked immediately.",
            "Your personally identifiable information will be deleted within 30 days (see our Privacy Policy).",
            "Your AliScript programs, match history, ELO data, and persisted arena replay records will be deleted or anonymised where required, and may be retained in aggregate or anonymised form for integrity and historical replay purposes.",
            "The usage licence you granted to Logic Arena for your submitted content will terminate.",
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start py-2.5 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <div className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
              <PublicBody>{item}</PublicBody>
            </div>
          ))}
          <PublicBody>Sections 4 (User-Generated Content licensing terms that survive termination), 8 (Intellectual Property), and 10 (Limitation of Liability) survive termination and remain binding.</PublicBody>
        </div>
      </PublicSectionCard>
    </>
  );
}
