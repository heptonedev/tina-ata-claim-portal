import { useEffect, useState } from "react";
import { getCampaigns, type CampaignInfo } from "@/lib/api";

export function useCampaigns(): CampaignInfo[] {
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  useEffect(() => {
    getCampaigns().then(setCampaigns);
  }, []);
  return campaigns;
}
