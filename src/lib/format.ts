export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 마감 시각을 한국 시간으로 표기한다 (예: October 31, 2026 at 23:59 KST). */
export function formatDeadline(iso: string): string {
  const parts = Object.fromEntries(DEADLINE_FORMAT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.month} ${parts.day}, ${parts.year} at ${parts.hour}:${parts.minute} KST`;
}

export function formatSol(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
