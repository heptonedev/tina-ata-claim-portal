import { API_BASE } from "./config";

export type CampaignInfo = { id: string; name: string | null; url: string | null };
export type CampaignPoints = CampaignInfo & { points: number };
export type ExistingClaim = { walletAddress: string; status: string; requestedAt: string };

export type GalxeSession = {
  sessionToken: string;
  galxeId: string;
  hasLinkedAddress: boolean;
  eligible: boolean;
  campaigns: CampaignPoints[];
  claim: ExistingClaim | null;
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the TINA server. Check your connection and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Something went wrong. Try again.", res.status);
  return data as T;
}

export function createGalxeSession(code: string): Promise<GalxeSession> {
  return post("/api/auth/galxe/session", { code });
}

export function submitClaim(input: { sessionToken: string; walletAddress: string; message: string; signature: string }) {
  return post<{ claimId: number; walletAddress: string; status: string }>("/api/claims", input);
}

export async function getCampaigns(): Promise<CampaignInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/galxe/campaigns`);
    if (!res.ok) return [];
    return (await res.json()).campaigns ?? [];
  } catch {
    return [];
  }
}
