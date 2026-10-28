export const EVENT_NAME = "galxe_airdrop";

// 신청 경로별 이벤트. 같은 사람이 Galxe·가챠 두 이벤트에 각각 신청할 수 있다.
export type ClaimSource = "galxe" | "gacha";
export const EVENT_NAMES: Record<ClaimSource, string> = {
  galxe: EVENT_NAME,
  gacha: "gacha_airdrop",
};

// 포인트당 지급 수량 (2026-10-20 마케팅 확정: Galxe·가챠 모두 1 포인트 = 1 TINA)
export const TINA_PER_POINT = 1;

/** CLAIMS_CLOSE_AT 값이 있는데 날짜로 읽을 수 없으면 true. 설정 실수로 마감이 풀리지 않게 신청을 막는다. */
export function claimsCloseAtInvalid(): boolean {
  const raw = (process.env.CLAIMS_CLOSE_AT ?? "").trim();
  return raw !== "" && Number.isNaN(Date.parse(raw));
}

/** 신청 마감 시각(ms). CLAIMS_CLOSE_AT (ISO, 예: 2026-11-20T23:59:59Z) 이 없거나 잘못됐으면 null. */
export function getClaimsCloseAt(): number | null {
  const closeAt = Date.parse(process.env.CLAIMS_CLOSE_AT ?? "");
  return Number.isNaN(closeAt) ? null : closeAt;
}

/** 마감 시각이 지났거나 마감 값이 잘못됐으면 true. 값이 없으면 마감 없음(로컬 개발용, prod 는 시작 시 필수 검사). */
export function claimsClosed(now = Date.now()): boolean {
  if (claimsCloseAtInvalid()) return true;
  const closeAt = getClaimsCloseAt();
  return closeAt !== null && now > closeAt;
}
