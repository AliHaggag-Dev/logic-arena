import type { Metadata } from "next";
import {
  AlertTriangle,
  Ban,
  BookOpen,
  Briefcase,
  Crown,
  FileText,
  Gavel,
  RefreshCw,
  Scale,
  Shield,
  Swords,
  UserCheck,
  Wifi,
  Zap,
} from "lucide-react";

import PublicPageLayout, {
  type PublicSection,
} from "@/components/PublicPageLayout";
import { LegalBasics, ContentConduct, ServiceTerms, LegalFooter } from "./sections";

export const metadata = {
  title: "Terms of Service | Logic Arena",
  description: "Logic Arena terms of service — rules and guidelines for using the platform.",
};

const SECTIONS: PublicSection[] = [
  { id: "acceptance", title: "Acceptance of Terms", label: "Acceptance" },
  { id: "eligibility", title: "Account Eligibility", label: "Eligibility" },
  { id: "permitted-use", title: "Permitted Use", label: "Permitted Use" },
  { id: "user-content", title: "User-Generated Content", label: "Your Content" },
  { id: "prohibited-conduct", title: "Prohibited Conduct", label: "Prohibited Conduct" },
  { id: "competitive-integrity", title: "Competitive Integrity", label: "Integrity" },
  { id: "service-availability", title: "Service Availability", label: "Availability" },
  { id: "intellectual-property", title: "Intellectual Property", label: "IP Rights" },
  { id: "termination", title: "Termination", label: "Termination" },
  { id: "limitation-of-liability", title: "Limitation of Liability", label: "Liability" },
  { id: "governing-law", title: "Governing Law", label: "Governing Law" },
];

export default function TermsPage() {
  return (
    <PublicPageLayout
      badge="Legal Document"
      title="Terms of Service"
      subtitle="These are the rules of the Arena. By accessing or using Logic Arena, you agree to be bound by these Terms. Read them. Know them. They exist to protect everyone — including you."
      lastUpdated="June 2026"
      sections={SECTIONS}
    >
      <LegalBasics />
      <ContentConduct />
      <ServiceTerms />
      <LegalFooter />
    </PublicPageLayout>
  );
}
