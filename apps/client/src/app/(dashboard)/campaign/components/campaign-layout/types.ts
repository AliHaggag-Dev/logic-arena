import type { Dispatch, SetStateAction } from "react";

import type { CampaignTabId } from "../../constants/campaign.constants";
import type { ApiLevelInfo, ApiTabInfo } from "../../types/campaign.types";

export interface CampaignLayoutProps {
  tabs: ApiTabInfo[];
  loading: boolean;
  isGuest: boolean;
  isMobile: boolean;
}

export interface CampaignViewProps {
  tabs: ApiTabInfo[];
  activeTabId: CampaignTabId;
  setActiveTabId: Dispatch<SetStateAction<CampaignTabId>>;
  setSelectedLevel: (level: ApiLevelInfo | null) => void;
}
