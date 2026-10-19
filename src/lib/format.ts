export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function formatSol(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
