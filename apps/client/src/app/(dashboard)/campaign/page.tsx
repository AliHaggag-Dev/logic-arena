import type { Metadata } from "next";
import CampaignPageClient from "./CampaignPageClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: { canonical: "https://logicarena.dev/campaign" },
  };
}

export default function CampaignPage() {
  return <CampaignPageClient />;
}
