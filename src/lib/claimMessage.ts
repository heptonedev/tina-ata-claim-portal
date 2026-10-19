// 형식은 API 서버 src/claim-signature.ts 의 verifyClaimSignature 와 같아야 한다.
export function buildClaimMessage(wallet: string, nonce: string, issuedAt = new Date().toISOString()): string {
  return ["TINA Airdrop Claim", `Wallet: ${wallet}`, `Nonce: ${nonce}`, `Issued At: ${issuedAt}`].join("\n");
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/** 서버가 발급한 세션 토큰에서 sid 를 읽는다 (서명 검증은 서버가 한다). */
export function readSessionNonce(sessionToken: string): string {
  const payload = sessionToken.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload)).sid;
}
