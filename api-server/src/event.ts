export const EVENT_NAME = "galxe_airdrop";

// 신청 경로별 이벤트. 같은 사람이 Galxe·가챠 두 이벤트에 각각 신청할 수 있다.
export type ClaimSource = "galxe" | "gacha";
export const EVENT_NAMES: Record<ClaimSource, string> = {
  galxe: EVENT_NAME,
  gacha: "gacha_airdrop",
};

// 포인트당 지급 수량 (2026-10-20 마케팅 확정: Galxe·가챠 모두 1 포인트 = 1 TINA)
export const TINA_PER_POINT = 1;

/** 신청 마감 시각(ms). CLAIMS_CLOSE_AT (ISO, 예: 2026-10-31T23:59:59+09:00) 이 없거나 잘못됐으면 null (마감 없음). */
export function getClaimsCloseAt(): number | null {
  const closeAt = Date.parse(process.env.CLAIMS_CLOSE_AT ?? "");
  return Number.isNaN(closeAt) ? null : closeAt;
}

export function claimsClosed(now = Date.now()): boolean {
  const closeAt = getClaimsCloseAt();
  return closeAt !== null && now > closeAt;
}
