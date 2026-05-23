import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, FlaskConical, Info, Lock, RefreshCw, ShieldCheck, ToggleRight } from "lucide-react";

import PublicPageLayout, {
  PublicBody, PublicDefinition, PublicFooterCTA, PublicSectionCard, type PublicSection,
} from "@/components/PublicPageLayout";

export const metadata: Metadata = {
  title: "Cookie Policy — Logic Arena",
  description: "A precise breakdown of every cookie Logic Arena sets, why it exists, and how long it lives. No surprises.",
};

const SECTIONS: PublicSection[] = [
  { id: "what-are-cookies", title: "What Are Cookies?", label: "What Are Cookies?" },
  { id: "essential-cookies", title: "Essential Cookies", label: "Essential" },
  { id: "analytics-cookies", title: "Zero Analytics & Tracking", label: "No Analytics" },
  { id: "local-storage", title: "Local Storage", label: "Local Storage" },
  { id: "third-party-cookies", title: "Third-Party Cookies", label: "Third-Party" },
  { id: "managing-preferences", title: "Managing Preferences", label: "Manage Prefs" },
  { id: "policy-updates", title: "Policy Updates", label: "Updates" },
];

interface CookieEntry { name: string; purpose: string; lifespan: string; }

function CookieTable({ cookies }: { cookies: CookieEntry[] }) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb),0.12)" }}>
      <div className="hidden sm:grid grid-cols-[1fr_2fr_auto] gap-4 px-5 py-3" style={{ background: "rgba(var(--accent-rgb),0.05)", borderBottom: "1px solid rgba(var(--accent-rgb),0.1)" }}>
        {["Cookie Name","Purpose","Lifespan"].map(h => (
          <span key={h} className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: "rgba(var(--accent-rgb),0.45)", fontFamily: "var(--font-mono)" }}>{h}</span>
        ))}
      </div>
      {cookies.map((c, i) => (
        <div key={c.name} className="flex flex-col sm:grid sm:grid-cols-[1fr_2fr_auto] gap-2 sm:gap-4 px-5 py-4" style={{ borderBottom: i < cookies.length - 1 ? "1px solid rgba(var(--accent-rgb),0.07)" : "none" }}>
          <code className="text-[11px] font-black tracking-widest self-start" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", padding: "2px 8px", background: "rgba(var(--accent-rgb),0.08)", border: "1px solid rgba(var(--accent-rgb),0.18)", borderRadius: "6px", display: "inline-block", whiteSpace: "nowrap" }}>{c.name}</code>
          <p className="text-[12px] sm:text-[13px] leading-[1.8]" style={{ color: "rgba(var(--accent-rgb),0.65)", fontFamily: "var(--font-mono)" }}>{c.purpose}</p>
          <span className="text-[10px] font-black tracking-wider self-start whitespace-nowrap" style={{ color: "rgba(var(--accent-rgb),0.5)", fontFamily: "var(--font-mono)", padding: "2px 8px", background: "rgba(var(--accent-rgb),0.04)", border: "1px solid rgba(var(--accent-rgb),0.1)", borderRadius: "6px" }}>{c.lifespan}</span>
        </div>
      ))}
    </div>
  );
}

export default function CookiesPage() {
  return (
    <PublicPageLayout badge="Legal Document" title="Cookie Policy" subtitle="A precise, jargon-free breakdown of every cookie Logic Arena sets — what it does, why it exists, and exactly how long it lives in your browser." lastUpdated="May 2026" sections={SECTIONS}>

      <PublicSectionCard id="what-are-cookies" index={1} title="What Are Cookies?" icon={<Cookie size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Cookies are small text files a website stores in your browser when you visit. They act as short-term memory — letting a site remember that you are logged in, what theme you prefer, and how you interact with its features.</PublicBody>
          <PublicBody>Not all cookies are equal. Logic Arena draws a strict line between technically necessary cookies and optional ones. We never activate optional cookies without your explicit consent.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="essential-cookies" index={2} title="Essential Cookies" icon={<Lock size={16} />}>
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 items-start p-4 rounded-xl" style={{ background: "rgba(var(--sem-success-rgb,34,197,94),0.06)", border: "1px solid rgba(var(--sem-success-rgb,34,197,94),0.18)" }}>
            <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: "var(--sem-success,#22c55e)" }} />
            <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(var(--sem-success-rgb,34,197,94),0.8)", fontFamily: "var(--font-mono)" }}><strong>Always active.</strong> We use exactly one essential cookie. It cannot be disabled without breaking authentication and security. No consent is required — it falls strictly under the necessary exemption.</p>
          </div>
          <CookieTable cookies={[
            { name: "la_session", purpose: "HttpOnly, Secure cookie containing your JWT (JSON Web Token). This is how the server knows you are logged in. It cannot be accessed by client-side JavaScript.", lifespan: "7 days (idle) / 30 days (remembered)" }
          ]} />
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="analytics-cookies" index={3} title="Zero Analytics & Tracking" icon={<FlaskConical size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>We believe in absolute privacy. Logic Arena <strong>does not use any analytics, telemetry, or tracking cookies</strong>. We do not track your session duration, page views, or click behavior.</PublicBody>
          <PublicBody>Because we have zero tracking cookies, we do not require a cookie consent banner. You will never be asked to &quot;Accept All&quot; because there is nothing to accept.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="local-storage" index={4} title="Local Storage (Not Cookies)" icon={<Info size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Instead of cookies, we use your browser&apos;s native `localStorage` for non-sensitive UI preferences. This data never leaves your device and is never sent to our servers.</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb),0.12)" }}>
            <PublicDefinition term="theme">Stores your chosen display theme (Cyberpunk, Light, Obsidian Ember) so it persists when you close the browser.</PublicDefinition>
          </div>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="third-party-cookies" index={5} title="Third-Party Cookies" icon={<Info size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>Logic Arena does not embed third-party advertising, social widgets, or tracking pixels. We do not use Google Analytics, Facebook Pixel, or any similar external tracking service.</PublicBody>
          <PublicBody>The only third-party context where cookies may be set is during the OAuth 2.0 sign-in flow via Google or GitHub. When you authenticate through those providers, they may set their own cookies according to their own policies — which we do not control.</PublicBody>
          <PublicBody>We recommend reviewing the cookie policies of <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="border-b transition-all" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.3)" }}>Google</a> and <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer" className="border-b transition-all" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.3)" }}>GitHub</a> if you use OAuth sign-in.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="managing-preferences" index={6} title="Managing Preferences" icon={<ToggleRight size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>You have full control over your session. You can clear your session cookie and local storage at any time through your browser&apos;s native settings.</PublicBody>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--accent-rgb),0.12)" }}>
            <PublicDefinition term="Disable all cookies">You may block all cookies via browser settings. This will prevent login entirely, as we cannot authenticate you without the `la_session` cookie.</PublicDefinition>
            <PublicDefinition term="Log out">Clicking &quot;Log out&quot; in the application will instruct the server to immediately invalidate and delete your `la_session` cookie.</PublicDefinition>
          </div>
        </div>
      </PublicSectionCard>

      <PublicSectionCard id="policy-updates" index={7} title="Policy Updates" icon={<RefreshCw size={16} />}>
        <div className="flex flex-col gap-4">
          <PublicBody>We may update this Cookie Policy when we introduce new platform features that require new cookies, or when applicable regulations change. Updates will be reflected on this page with a revised date.</PublicBody>
        </div>
      </PublicSectionCard>

      <PublicFooterCTA>
        Questions?{" "}
        <Link href="/contact" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.35)" }}>Contact our team</Link>
        {" "}·{" "}
        <Link href="/privacy" className="inline-block border-b transition-all duration-200 ml-1 hover:-translate-y-[1px] hover:border-accent hover:text-accent/90" style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.35)" }}>Privacy Policy</Link>
      </PublicFooterCTA>
    </PublicPageLayout>
  );
}
