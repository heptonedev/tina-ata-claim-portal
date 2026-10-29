export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Galxe ID 처럼 길이가 정해지지 않은 값은 앞 4자·뒤 3자만 보인다 (예: dLKq…bz9). */
export function shortId(id: string): string {
  return id.length > 9 ? `${id.slice(0, 4)}…${id.slice(-3)}` : id;
}

const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 마감 시각을 약관과 같은 UTC 로 표기한다 (예: November 20, 2026, at 23:59 UTC). */
export function formatDeadline(iso: string): string {
  const parts = Object.fromEntries(DEADLINE_FORMAT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.month} ${parts.day}, ${parts.year}, at ${parts.hour}:${parts.minute} UTC`;
}

export function formatSol(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
