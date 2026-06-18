import Link from "next/link";
import { Cookie, Shield, UserCheck } from "lucide-react";
import { PublicBody, PublicSectionCard } from "@/components/PublicPageLayout";

export function CookiesSecurity() {
  return (
    <>
      <PublicSectionCard id="cookies-tracking" index={7} title="Cookies & Tracking" icon={<Cookie size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>We use an essential secure session cookie to operate authenticated features. We also load Google Analytics lazily to understand aggregate usage and performance; analytics cookies or similar browser identifiers may be set by Google when that script runs.</PublicBody>
          <PublicBody>See our full{" "}
            <Link href="/cookies" className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}>Cookie Policy</Link>{" "}
            for a complete breakdown.
          </PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="security" index={8} title="Security" icon={<Shield size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Security is not an afterthought at Logic Arena — it is a core design requirement. We implement the following measures to protect your data:</PublicBody>
          {[
            ["Encryption in Transit", "All communication between your browser and our servers is encrypted using TLS 1.2+. WebSocket connections use WSS (WebSocket Secure)."],
            ["Encryption at Rest", "Sensitive fields in our database are encrypted at the column level. Passwords are hashed with bcrypt (cost factor 12+) and are never stored in plain text."],
            ["Access Controls", "Production database access is restricted to a minimal set of backend services operating under least-privilege principles. No human can query raw user data without an audited approval workflow."],
            ["Infrastructure Hardening", "Our servers do not expose unnecessary ports. SSH access is key-only and MFA-protected. All infrastructure changes are deployed through a CI/CD pipeline with mandatory review gates."],
          ].map(([heading, body]) => (
            <div key={heading} className="flex gap-4 items-start py-3 border-b last:border-0" style={{ borderColor: "rgba(var(--accent-rgb), 0.08)" }}>
              <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{heading}</p>
                <PublicBody>{body}</PublicBody>
              </div>
            </div>
          ))}
          <PublicBody>No system connected to the internet can guarantee absolute security. We encourage you to use a strong, unique password (or OAuth), and to contact us immediately at the address on our{" "}
            <Link href="/contact" className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}>Contact page</Link>{" "}
            if you discover a potential security vulnerability.
          </PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="childrens-privacy" index={9} title="Children's Privacy" icon={<UserCheck size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you are under 13, you may not create an account or use the platform.</PublicBody>
          <PublicBody>If you are a parent or guardian and believe that your child has provided us with personal data without your consent, please contact us immediately via our{" "}
            <Link href="/contact" className="inline-block border-b transition-all duration-200 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb), 0.3)" }}>Contact page</Link>
            . We will investigate and delete the data promptly.
          </PublicBody>
        </div>
      </PublicSectionCard>
    </>
  );
}
