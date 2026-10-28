// Galxe OAuth 와 공개 GraphQL API 연동.
// 포인트는 Galxe 계정 단위다. 연결 주소(EVM·Solana)나 Galxe ID 어느 것으로 조회해도 같은 계정 포인트가 나온다.

const GALXE_CLIENT_ID = process.env.GALXE_CLIENT_ID || "2129a0a0f3b7f593e9923cfd745dd665af85fb166b5a4cf93ebeda38ea58b84f";
const GALXE_TOKEN_URL = "https://api.galxe.com/oauth/auth/2/token";
const GALXE_USER_URL = "https://api.galxe.com/oauth/api/2/user";
const GALXE_GRAPHQL_URL = process.env.GALXE_GRAPHQL_URL || "https://graphigo.prd.galaxy.eco/query";
const USER_SCOPES = "GalxeID SolanaAddress EVMAddress Email Twitter Discord Github Telegram";
const REQUEST_TIMEOUT_MS = 8000;

export class GalxeUnavailableError extends Error {}

export type GalxeUser = {
  galxeId: string;
  addresses: string[];
  raw: Record<string, unknown>;
};

export type CampaignInfo = { id: string; name: string | null; url: string | null };
export type CampaignPoints = CampaignInfo & { points: number };

// 포인트 조회 없이 캠페인 정보만 필요할 때 쓰는 주소 (어떤 캠페인에서도 포인트가 없다)
const NO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CAMPAIGN_INFO_TTL_MS = 10 * 60 * 1000;
let campaignInfoCache: { at: number; list: CampaignInfo[] } | null = null;

export function getCampaignIds(): string[] {
  return (process.env.GALXE_CAMPAIGN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw new GalxeUnavailableError(`Galxe request failed: ${(err as Error).message}`);
  }
}

function pickString(data: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** OAuth code 를 사용자 정보로 바꾼다. code 가 잘못됐으면 null. */
export async function exchangeCodeForUser(code: string): Promise<GalxeUser | null> {
  const tokenRes = await fetchWithTimeout(GALXE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GALXE_CLIENT_ID,
      client_secret: process.env.GALXE_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    console.error("Galxe token error:", tokenRes.status, await tokenRes.text());
    return null;
  }
  const { access_token: accessToken } = await tokenRes.json();

  const userRes = await fetchWithTimeout(`${GALXE_USER_URL}?scope=${encodeURIComponent(USER_SCOPES)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    console.error("Galxe user info error:", userRes.status, await userRes.text());
    return null;
  }
  const raw = (await userRes.json()) as Record<string, unknown>;

  const galxeId = raw.GalxeID != null ? String(raw.GalxeID) : null;
  if (!galxeId) return null;

  const addresses = [
    pickString(raw, "EVMAddress", "evmAddress", "address"),
    pickString(raw, "SolanaAddress", "solanaAddress"),
  ].filter((a): a is string => !!a);

  return { galxeId, addresses: [...new Set(addresses)], raw };
}

type CampaignResult = { name: string | null; url: string | null; points: number };

async function queryCampaignPoints(campaignId: string, address: string): Promise<CampaignResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.GALXE_ACCESS_TOKEN) headers["access-token"] = process.env.GALXE_ACCESS_TOKEN;

  const res = await fetchWithTimeout(GALXE_GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: "query($id: ID!, $address: String!) { campaign(id: $id) { name space { alias } claimedLoyaltyPoints(address: $address) } }",
      variables: { id: campaignId, address },
    }),
  });
  if (!res.ok) throw new GalxeUnavailableError(`Galxe GraphQL HTTP ${res.status}`);

  const body = await res.json();
  if (body.errors?.length || !body.data?.campaign) {
    throw new GalxeUnavailableError(`Galxe GraphQL error: ${JSON.stringify(body.errors ?? body).slice(0, 300)}`);
  }
  const { name, space, claimedLoyaltyPoints } = body.data.campaign;
  return {
    name: name ?? null,
    url: space?.alias ? `https://app.galxe.com/quest/${space.alias}/${campaignId}` : null,
    points: Number(claimedLoyaltyPoints) || 0,
  };
}

/**
 * 캠페인마다 사용자의 포인트를 조회한다. lookups 는 Galxe ID 와 연결 주소들.
 * Galxe 는 EVM·Solana 주소나 Galxe ID 중 무엇으로 조회해도 같은 계정의 전체 포인트를 돌려준다(2026-10-28 확인).
 * 그래서 더하면 두 주소가 연결된 계정은 2배가 된다. 가장 큰 값 하나만 쓴다.
 */
export async function getCampaignPoints(lookups: string[], campaignIds = getCampaignIds()): Promise<CampaignPoints[]> {
  return Promise.all(
    campaignIds.map(async (id) => {
      const targets = lookups.length > 0 ? lookups : [NO_ADDRESS];
      const results = await Promise.all(targets.map((target) => queryCampaignPoints(id, target)));
      // 조회 대상마다 값이 다르면 주소별로 따로 쌓인 포인트일 수 있다(최댓값이면 적게 잡힌다). 지급 전 대조용으로 남긴다
      if (lookups.length > 1 && new Set(results.map((r) => r.points)).size > 1) {
        console.warn(`galxe points mismatch: campaign=${id} galxeId=${lookups[0]} points=${results.map((r) => r.points).join("/")}`);
      }
      return {
        id,
        name: results.find((r) => r.name)?.name ?? null,
        url: results.find((r) => r.url)?.url ?? null,
        points: lookups.length > 0 ? Math.max(0, ...results.map((r) => r.points)) : 0,
      };
    }),
  );
}

/** 두 캠페인 중 한 곳이라도 포인트가 있으면 대상자 (OR 조건). */
export function isEligible(campaigns: CampaignPoints[]): boolean {
  return campaigns.some((c) => c.points > 0);
}

/** 로그인 전 화면에 보여줄 캠페인 이름·링크. Galxe 호출을 줄이려고 10분 캐시한다. */
export async function getCampaignInfo(now = Date.now()): Promise<CampaignInfo[]> {
  if (campaignInfoCache && now - campaignInfoCache.at < CAMPAIGN_INFO_TTL_MS) return campaignInfoCache.list;
  const list = (await getCampaignPoints([])).map(({ id, name, url }) => ({ id, name, url }));
  campaignInfoCache = { at: now, list };
  return list;
}
