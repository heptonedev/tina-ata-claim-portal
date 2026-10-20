// 가챠 이벤트 백엔드 연동. 가챠 로그인(JWT)으로 /me 를 불러 지갑 주소와 포인트를 확인한다.
// 가챠 백엔드가 JWT 를 검증하므로, 응답의 주소가 곧 브라우저가 서명으로 증명한 가챠 지갑이다.

const GACHA_API_URL = process.env.GACHA_API_URL || "https://tina-gacha-api.tina.im";
const REQUEST_TIMEOUT_MS = 8000;

export class GachaUnavailableError extends Error {}

export type GachaWallet = { address: string; totalPoints: number };

/** 가챠 JWT 가 유효하면 지갑 정보, 만료·위조면 null. */
export async function getGachaWallet(accessToken: string): Promise<GachaWallet | null> {
  let res: Response;
  try {
    res = await fetch(`${GACHA_API_URL}/api/wallets/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new GachaUnavailableError(`Gacha request failed: ${(err as Error).message}`);
  }
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new GachaUnavailableError(`Gacha /me HTTP ${res.status}`);

  const body = await res.json().catch(() => null);
  const data = body?.success ? body.data : null;
  if (!data || typeof data.address !== "string" || !data.address) {
    throw new GachaUnavailableError(`Gacha /me unexpected body: ${JSON.stringify(body).slice(0, 200)}`);
  }
  const totalPoints = Number(data.totalPoints);
  return { address: data.address, totalPoints: Number.isFinite(totalPoints) && totalPoints > 0 ? Math.floor(totalPoints) : 0 };
}
