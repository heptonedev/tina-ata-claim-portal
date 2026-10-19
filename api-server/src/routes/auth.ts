import { Router } from "express";
import nacl from "tweetnacl";
import bs58 from "bs58";
import pool from "../db.js";

const router = Router();

const GALXE_CLIENT_ID = process.env.GALXE_CLIENT_ID || "2129a0a0f3b7f593e9923cfd745dd665af85fb166b5a4cf93ebeda38ea58b84f";
const GALXE_CLIENT_SECRET = process.env.GALXE_CLIENT_SECRET || "";
const GALXE_TOKEN_URL = "https://api.galxe.com/oauth/auth/2/token";
const GALXE_USER_URL = "https://api.galxe.com/oauth/api/2/user";

const ALL_SCOPES = "GalxeID SolanaAddress EVMAddress Email Twitter Discord Github Telegram";

const EVENT_NAME = "galxe_airdrop";
const CLAIM_MESSAGE_TITLE = "TINA Airdrop Claim";
// 서명 후 Galxe 로그인을 거쳐 돌아오는 시간을 고려한 유효 시간
const SIGNATURE_MAX_AGE_MS = 15 * 60 * 1000;
const SIGNATURE_MAX_FUTURE_SKEW_MS = 60 * 1000;

/**
 * 신청 지갑의 소유자가 서명한 메시지인지 확인한다. 문제가 없으면 null, 있으면 에러 문구를 돌려준다.
 * 메시지 형식은 프론트 useTinaToken 의 buildClaimMessage 와 같아야 한다.
 *   TINA Airdrop Claim
 *   Wallet: <walletAddress>
 *   Nonce: <oauth state>
 *   Issued At: <ISO 8601>
 */
export function verifyClaimSignature(
  walletAddress: string,
  message: string,
  signatureBase64: string,
  now = Date.now(),
): string | null {
  const lines = message.split("\n");
  if (lines.length !== 4 || lines[0] !== CLAIM_MESSAGE_TITLE) {
    return "Invalid claim message format";
  }
  if (lines[1] !== `Wallet: ${walletAddress}`) {
    return "Message does not match wallet";
  }
  if (!lines[2].startsWith("Nonce: ") || lines[2].length <= "Nonce: ".length) {
    return "Invalid claim message format";
  }
  const issuedAt = Date.parse(lines[3].replace(/^Issued At: /, ""));
  if (!lines[3].startsWith("Issued At: ") || Number.isNaN(issuedAt)) {
    return "Invalid claim message format";
  }
  if (now - issuedAt > SIGNATURE_MAX_AGE_MS || issuedAt - now > SIGNATURE_MAX_FUTURE_SKEW_MS) {
    return "Claim signature expired. Please try again.";
  }

  try {
    const publicKey = bs58.decode(walletAddress);
    const signature = Buffer.from(signatureBase64, "base64");
    if (publicKey.length !== 32 || signature.length !== 64) {
      return "Invalid signature";
    }
    const ok = nacl.sign.detached.verify(new TextEncoder().encode(message), signature, publicKey);
    return ok ? null : "Invalid signature";
  } catch {
    return "Invalid signature";
  }
}

// POST /api/auth/galxe/verify — 지갑 서명 검증 + Galxe OAuth code 검증 + 에어드롭 신청
router.post("/galxe/verify", async (req, res) => {
  const { code, walletAddress, message, signature } = req.body;

  if (!code || !walletAddress || !message || !signature) {
    res.status(400).json({ error: "code, walletAddress, message and signature are required" });
    return;
  }
  if (typeof walletAddress !== "string" || typeof message !== "string" || typeof signature !== "string") {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  // 1. 신청 지갑의 본인 서명 확인 (Galxe 계정 하나로 남의 지갑·여러 지갑을 등록하지 못하게)
  const signatureError = verifyClaimSignature(walletAddress, message, signature);
  if (signatureError) {
    res.status(401).json({ error: signatureError });
    return;
  }

  try {
    // 2. code → access_token 교환
    const tokenRes = await fetch(GALXE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GALXE_CLIENT_ID,
        client_secret: GALXE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Galxe token error:", err);
      res.status(401).json({ error: "Galxe authentication failed" });
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 3. 사용자 정보 전체 조회
    const userRes = await fetch(`${GALXE_USER_URL}?scope=${encodeURIComponent(ALL_SCOPES)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("Galxe user info error:", await userRes.text());
      res.status(401).json({ error: "Failed to fetch Galxe user info" });
      return;
    }

    const userData = await userRes.json();
    console.log("Galxe user data:", JSON.stringify(userData));

    const galxeId = userData.GalxeID ? String(userData.GalxeID) : null;
    if (!galxeId) {
      res.status(401).json({ error: "Galxe account could not be identified" });
      return;
    }

    // GalxeID 제외한 나머지를 galxe_user_data JSON으로 저장
    const { GalxeID, ...userDataWithoutId } = userData;

    // 4. 중복 신청 확인 — 지갑당 1회, Galxe 계정당 1회
    const [existing] = await pool.query(
      "SELECT id, status, wallet_address, galxe_id FROM event_claims WHERE event_name = ? AND (wallet_address = ? OR galxe_id = ?)",
      [EVENT_NAME, walletAddress, galxeId],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      const claim = existing[0] as { id: number; status: string; wallet_address: string; galxe_id: string | null };
      const byGalxe = claim.galxe_id === galxeId && claim.wallet_address !== walletAddress;
      res.status(409).json({
        error: byGalxe ? "This Galxe account has already claimed the airdrop" : "Airdrop already claimed",
        claim: { id: claim.id, status: claim.status },
      });
      return;
    }

    // 5. 에어드롭 신청 저장
    const [result] = await pool.query(
      `INSERT INTO event_claims (event_name, wallet_address, galxe_id, galxe_user_data, token_amount, status, requested_at)
       VALUES (?, ?, ?, ?, 0, 'pending', NOW())`,
      [EVENT_NAME, walletAddress, galxeId, JSON.stringify(userDataWithoutId)],
    );

    res.status(201).json({
      message: "Airdrop claim submitted",
      claimId: (result as any).insertId,
      status: "pending",
      galxeId,
    });
  } catch (err) {
    // 동시 요청으로 위 중복 확인을 함께 통과한 경우 UNIQUE 제약이 막는다
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Airdrop already claimed" });
      return;
    }
    console.error("Galxe verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
