import type { Metadata } from "next";
import CampaignLevelPageClient from "./CampaignLevelPageClient";

interface CampaignLevelPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CampaignLevelPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    alternates: { canonical: `https://logicarena.dev/campaign/${id}` },
  };
}

export default function CampaignLevelPage() {
  return <CampaignLevelPageClient />;
}
