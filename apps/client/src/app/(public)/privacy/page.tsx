import type { Metadata } from "next";
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
  type PublicSection,
} from "@/components/PublicPageLayout";
import { DataUsage, NetworkRetention, CookiesSecurity, RightsUpdates } from "./sections";

export const metadata = {
  title: "Privacy Policy | Logic Arena",
  description: "Logic Arena privacy policy — how we collect, use, and protect your data.",
};

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

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      badge="Legal Document"
      title="Privacy Policy"
      subtitle="We believe transparency is not optional — it is a competitive advantage. This document explains exactly what data we collect, why we collect it, and how we keep it secure."
      lastUpdated="June 2026"
      sections={SECTIONS}
    >
      <DataUsage />
      <NetworkRetention />
      <CookiesSecurity />
      <RightsUpdates />
    </PublicPageLayout>
  );
}
