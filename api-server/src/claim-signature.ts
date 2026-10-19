import nacl from "tweetnacl";
import bs58 from "bs58";

const CLAIM_MESSAGE_TITLE = "TINA Airdrop Claim";
const SIGNATURE_MAX_AGE_MS = 10 * 60 * 1000;
const SIGNATURE_MAX_FUTURE_SKEW_MS = 60 * 1000;

/**
 * 신청 지갑의 소유자가 이 Galxe 세션에 대해 서명했는지 확인한다.
 * 문제가 없으면 null, 있으면 사용자에게 보여줄 에러 문구를 돌려준다.
 *
 * 메시지 형식 (프론트 src/lib/claimMessage.ts 와 같아야 한다):
 *   TINA Airdrop Claim
 *   Wallet: <walletAddress>
 *   Nonce: <세션 sid>
 *   Issued At: <ISO 8601>
 *
 * Nonce 를 세션 sid 와 맞춰서, 다른 Galxe 세션에서 받은 서명을 재사용하지 못하게 한다.
 */
export function verifyClaimSignature(
  walletAddress: string,
  expectedNonce: string,
  message: string,
  signatureBase64: string,
  now = Date.now(),
): string | null {
  const lines = message.split("\n");
  if (lines.length !== 4 || lines[0] !== CLAIM_MESSAGE_TITLE || !lines[3].startsWith("Issued At: ")) {
    return "Invalid claim message";
  }
  if (lines[1] !== `Wallet: ${walletAddress}`) {
    return "The signed message is for a different wallet";
  }
  if (lines[2] !== `Nonce: ${expectedNonce}`) {
    return "The signature belongs to a different sign-in. Sign again.";
  }
  const issuedAt = Date.parse(lines[3].slice("Issued At: ".length));
  if (Number.isNaN(issuedAt)) {
    return "Invalid claim message";
  }
  if (now - issuedAt > SIGNATURE_MAX_AGE_MS || issuedAt - now > SIGNATURE_MAX_FUTURE_SKEW_MS) {
    return "The signature has expired. Sign again.";
  }

  try {
    const publicKey = bs58.decode(walletAddress);
    const signature = Buffer.from(signatureBase64, "base64");
    if (publicKey.length !== 32 || signature.length !== 64) {
      return "Invalid signature";
    }
    return nacl.sign.detached.verify(new TextEncoder().encode(message), signature, publicKey)
      ? null
      : "Invalid signature";
  } catch {
    return "Invalid signature";
  }
}
