export const EVENT_NAME = "galxe_airdrop";

/** 신청 마감 시각(ms). CLAIMS_CLOSE_AT (ISO, 예: 2026-10-31T23:59:59+09:00) 이 없거나 잘못됐으면 null (마감 없음). */
export function getClaimsCloseAt(): number | null {
  const closeAt = Date.parse(process.env.CLAIMS_CLOSE_AT ?? "");
  return Number.isNaN(closeAt) ? null : closeAt;
}

export function claimsClosed(now = Date.now()): boolean {
  const closeAt = getClaimsCloseAt();
  return closeAt !== null && now > closeAt;
}
