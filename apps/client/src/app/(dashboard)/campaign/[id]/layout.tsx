import { Metadata } from "next";
import { CAMPAIGN_TABS } from "../constants/campaign.constants";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/** Map of all tab+level titles for SEO metadata, built from client constants. */
const LEVEL_TITLE_MAP: Record<string, string> = {};
for (const tab of CAMPAIGN_TABS) {
  // Tab-level titles are not available at build time without the server catalog,
  // so we generate generic but descriptive metadata from the tab label.
  LEVEL_TITLE_MAP[tab.id] = tab.label;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const levelId = resolvedParams.id;
  const tabId = levelId.split("-")[0];

  const TAB_LABEL_MAP: Record<string, string> = {
    cond: "Conditionals",
    loop: "Loops",
    arr: "Arrays",
    ds: "Data Structures",
    rec: "Recursion",
    gfx: "Graph Theory",
  };

  const tabLabel = TAB_LABEL_MAP[tabId] ?? "Campaign";

  return {
    title: `${tabLabel} Level ${levelId} - Campaign | Logic Arena`,
    description: "Write AliScript code to defeat the enemy robot in this campaign level.",
  };
}

export default function CampaignLevelLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
