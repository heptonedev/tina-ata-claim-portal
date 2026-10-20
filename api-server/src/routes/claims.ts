import { Router } from "express";
import pool from "../db.js";
import { claimsClosed, EVENT_NAMES, TINA_PER_POINT } from "../event.js";
import { verifyClaimSignature } from "../claim-signature.js";
import { verifySession } from "../session.js";
import { hasTinaTokenAccount } from "../token-account.js";

const router = Router();

// POST /api/claims — Galxe 또는 가챠 세션 + 지갑 서명으로 에어드롭을 신청한다.
// 지급 수량은 신청자가 정하지 않는다. 세션 발급 때 확인한 포인트 × TINA_PER_POINT 로 서버가 정한다
// (지급 전에 마감 시점 포인트로 다시 확인한다).
// 신청 지갑에는 TINA 토큰 계정(ATA)이 있어야 한다 (신청자가 직접 만든다).
router.post("/", async (req, res) => {
  const { sessionToken, walletAddress, message, signature } = req.body ?? {};

  // CLAIMS_CLOSE_AT 이후에는 신청을 받지 않는다
  if (claimsClosed()) {
    res.status(403).json({ error: "Claims are closed." });
    return;
  }

  const session = verifySession(sessionToken);
  if (!session) {
    res.status(401).json({ error: "Your sign-in has expired. Sign in again." });
    return;
  }
  if (!session.eligible) {
    res.status(403).json({
      error: session.source === "gacha" ? "This wallet has no Lucky Points from the Gacha event." : "This Galxe account has no points in the TINA campaigns.",
    });
    return;
  }
  if (typeof walletAddress !== "string" || typeof message !== "string" || typeof signature !== "string") {
    res.status(400).json({ error: "walletAddress, message and signature are required" });
    return;
  }

  const signatureError = verifyClaimSignature(walletAddress, session.sid, message, signature);
  if (signatureError) {
    res.status(401).json({ error: signatureError });
    return;
  }

  try {
    if (!(await hasTinaTokenAccount(walletAddress))) {
      res.status(400).json({ error: "This wallet has no TINA token account yet. Create it, then claim." });
      return;
    }
  } catch (err) {
    console.error("Token account check failed:", (err as Error).message);
    res.status(503).json({ error: "Couldn't check your TINA token account. Try again in a minute." });
    return;
  }

  // 이벤트마다 계정당 1회: Galxe 는 galxe_id, 가챠는 gacha_address 로 막는다
  const eventName = EVENT_NAMES[session.source];
  const accountColumn = session.source === "gacha" ? "gacha_address" : "galxe_id";
  const accountLabel = session.source === "gacha" ? "Gacha wallet" : "Galxe account";

  try {
    const [rows] = await pool.query(
      `SELECT wallet_address, ${accountColumn} AS account FROM event_claims WHERE event_name = ? AND (${accountColumn} = ? OR wallet_address = ?) LIMIT 1`,
      [eventName, session.account, walletAddress],
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const existing = rows[0] as { wallet_address: string; account: string | null };
      res.status(409).json({
        error: existing.account === session.account
          ? `This ${accountLabel} has already claimed.`
          : "This wallet has already been used for a claim.",
      });
      return;
    }

    const tokenAmount = session.points * TINA_PER_POINT;
    const [result] = await pool.query(
      `INSERT INTO event_claims (event_name, wallet_address, ${accountColumn}, points, galxe_user_data, token_amount, status, requested_at)
       VALUES (?, ?, ?, ?, NULL, ?, 'pending', NOW())`,
      [eventName, walletAddress, session.account, session.points, tokenAmount],
    );
    console.log(`claim saved: id=${(result as any).insertId} source=${session.source} account=${session.account} wallet=${walletAddress} points=${session.points}`);

    res.status(201).json({ claimId: (result as any).insertId, walletAddress, status: "pending", tokenAmount });
  } catch (err) {
    // 동시 요청으로 중복 확인을 함께 통과하면 UNIQUE 제약이 막는다
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: `This ${accountLabel} or wallet has already claimed.` });
      return;
    }
    console.error("Claim error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
