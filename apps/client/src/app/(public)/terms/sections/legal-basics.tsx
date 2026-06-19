import Link from "next/link";
import { FileText, UserCheck, BookOpen } from "lucide-react";
import { PublicBody, PublicDefinition, PublicSectionCard } from "@/components/PublicPageLayout";

export function LegalBasics() {
  return (
    <>
      <PublicSectionCard id="acceptance" index={1} title="Acceptance of Terms" icon={<FileText size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>
            By accessing, browsing, or using Logic Arena — including registering an account, writing AliScript programs, or participating in any competitive match — you confirm that you have read, understood, and agree to be legally bound by these Terms of Service and our{" "}
            <Link href="/privacy" className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}>Privacy Policy</Link>.
          </PublicBody>
          <PublicBody>If you do not agree to these Terms in their entirety, you must immediately cease using the platform and, if applicable, delete your account.</PublicBody>
          <PublicBody>Logic Arena reserves the right to revise these Terms at any time. When material changes are made, we will notify you via email and through an in-platform notice no fewer than 14 days before the changes take effect. Continued use of the Service after the effective date constitutes acceptance of the revised Terms.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="eligibility" index={2} title="Account Eligibility" icon={<UserCheck size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>To create an account and use Logic Arena, you must meet the following requirements:</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb), 0.12)" }}>
            <PublicDefinition term="Age">You must be at least 13 years of age. If you are under 18, you represent that you have obtained parental or guardian consent to use the platform.</PublicDefinition>
            <PublicDefinition term="Authority">You have the legal capacity and authority to enter into a binding agreement in your jurisdiction.</PublicDefinition>
            <PublicDefinition term="Accuracy">All information you provide during registration is accurate, complete, and current. You agree to maintain the accuracy of this information over time.</PublicDefinition>
            <PublicDefinition term="Account Security">You are solely responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account, whether or not authorised by you.</PublicDefinition>
          </div>
          <PublicBody>You may hold only one Logic Arena account per person. Creating multiple accounts is a violation of these Terms and may result in immediate suspension of all associated accounts.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="permitted-use" index={3} title="Permitted Use" icon={<BookOpen size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena grants you a limited, personal, non-exclusive, non-transferable, revocable licence to access and use the platform for its intended purpose: competitive programming, robot combat simulation, and skill development.</PublicBody>
          <PublicBody>Within this licence, you are permitted to:</PublicBody>
          {[
            "Write, test, and submit AliScript programs to control virtual robots in competitive and campaign modes.",
            "Participate in ranked matches, Campaigns, Practice vs AI runs, or Tournaments.",
            "Use campaign-only pause/resume and temporary campaign replay controls for learning and review.",
            "Watch live matches via Spectator Mode and interact with the Black Market economy.",
            "Access and read platform documentation, patch notes, and community resources.",
            "Share persisted arena match replays and your AliScript programs with other users for educational or community purposes.",
            "Report bugs and submit feature requests through official channels.",
          ].map((item) => (
            <div key={item} className="flex gap-3 items-start py-2.5 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <div className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full" style={{ background: "var(--sem-success, #22c55e)", boxShadow: "0 0 6px var(--sem-success, #22c55e)" }} />
              <PublicBody>{item}</PublicBody>
            </div>
          ))}
        </div>
      </PublicSectionCard>
    </>
  );
}
