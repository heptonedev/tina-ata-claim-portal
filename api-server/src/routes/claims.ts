import { Router } from "express";
import pool from "../db.js";
import { EVENT_NAME } from "../event.js";
import { verifyClaimSignature } from "../claim-signature.js";
import { verifySession } from "../session.js";
import { hasTinaTokenAccount } from "../token-account.js";

const router = Router();

// POST /api/claims — Galxe 세션 + 지갑 서명으로 에어드롭을 신청한다.
// 지급 수량은 신청자가 정하지 않는다 (token_amount 는 0 으로 두고 지급 기준이 정해지면 서버가 채운다).
// 신청 지갑에는 TINA 토큰 계정(ATA)이 있어야 한다 (신청자가 직접 만든다).
router.post("/", async (req, res) => {
  const { sessionToken, walletAddress, message, signature } = req.body ?? {};

  // CLAIMS_CLOSE_AT (ISO 시각, 예: 2026-10-31T23:59:59+09:00) 이후에는 신청을 받지 않는다
  const closeAt = Date.parse(process.env.CLAIMS_CLOSE_AT ?? "");
  if (!Number.isNaN(closeAt) && Date.now() > closeAt) {
    res.status(403).json({ error: "Claims are closed." });
    return;
  }

  const session = verifySession(sessionToken);
  if (!session) {
    res.status(401).json({ error: "Your Galxe sign-in has expired. Sign in again." });
    return;
  }
  if (!session.eligible) {
    res.status(403).json({ error: "This Galxe account has no points in the TINA campaigns." });
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

  try {
    const [rows] = await pool.query(
      "SELECT wallet_address, galxe_id FROM event_claims WHERE event_name = ? AND (galxe_id = ? OR wallet_address = ?) LIMIT 1",
      [EVENT_NAME, session.galxeId, walletAddress],
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const existing = rows[0] as { wallet_address: string; galxe_id: string | null };
      res.status(409).json({
        error: existing.galxe_id === session.galxeId
          ? "This Galxe account has already claimed."
          : "This wallet has already been used for a claim.",
      });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO event_claims (event_name, wallet_address, galxe_id, galxe_user_data, token_amount, status, requested_at)
       VALUES (?, ?, ?, NULL, 0, 'pending', NOW())`,
      [EVENT_NAME, walletAddress, session.galxeId],
    );
    console.log(`claim saved: id=${(result as any).insertId} galxeId=${session.galxeId} wallet=${walletAddress}`);

    res.status(201).json({ claimId: (result as any).insertId, walletAddress, status: "pending" });
  } catch (err) {
    // 동시 요청으로 중복 확인을 함께 통과하면 UNIQUE 제약이 막는다
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "This Galxe account or wallet has already claimed." });
      return;
    }
    console.error("Claim error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
