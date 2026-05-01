import { Metadata } from "next";
import { CAMPAIGN_LEVELS } from "../constants/levels.constants";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const levelId = parseInt(resolvedParams.id, 10);
  const level = CAMPAIGN_LEVELS.find((l) => l.id === levelId);

  return {
    title: level ? `Level ${levelId}: ${level.name} - Campaign | Logic Arena` : "Campaign Level | Logic Arena",
    description: "Write AliScript code to defeat the enemy robot in this campaign level.",
  };
}

export default function CampaignLevelLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
