/**
 * Format balance up to maxDecimals places, trimming trailing zeros.
 * e.g. 1.50000000 → "1.5", 0.00203928 → "0.00203928", 5000.00 → "5,000"
 */
export function formatBalance(value: number, maxDecimals = 8): string {
  const fixed = value.toFixed(maxDecimals);
  const trimmed = fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
  const [intPart, decPart] = trimmed.split(".");
  const intFormatted = Number(intPart).toLocaleString();
  return decPart ? `${intFormatted}.${decPart}` : intFormatted;
}
