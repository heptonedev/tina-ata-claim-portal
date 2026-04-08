import { Router } from "express";
import nacl from "tweetnacl";
import bs58 from "bs58";
import pool from "../db.js";

const router = Router();

function verifySignature(walletAddress: string, message: string, signature: string): boolean {
  try {
    const publicKey = bs58.decode(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch {
    return false;
  }
}

// POST /api/airdrop/claim — 에어드롭 신청
router.post("/claim", async (req, res) => {
  const { walletAddress, amount, eventName, message, signature } = req.body;

  if (!walletAddress || typeof walletAddress !== "string") {
    res.status(400).json({ error: "walletAddress is required" });
    return;
  }

  if (!message || !signature) {
    res.status(400).json({ error: "message and signature are required" });
    return;
  }

  // 서명 검증
  if (!verifySignature(walletAddress, message, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // 메시지에 지갑 주소가 포함되어 있는지 확인 (리플레이 공격 방지)
  if (!message.includes(walletAddress)) {
    res.status(401).json({ error: "Message does not match wallet" });
    return;
  }

  const tokenAmount = Number(amount) || 0;
  const event = eventName || "galxe_airdrop";

  try {
    // 중복 신청 확인
    const [existing] = await pool.query(
      "SELECT id, status FROM event_claims WHERE event_name = ? AND wallet_address = ?",
      [event, walletAddress],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      res.status(409).json({ error: "Airdrop already claimed", claim: existing[0] });
      return;
    }

    // 신청 저장
    const [result] = await pool.query(
      `INSERT INTO event_claims (event_name, wallet_address, token_amount, status, requested_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [event, walletAddress, tokenAmount],
    );

    res.status(201).json({
      message: "Airdrop claim submitted",
      claimId: (result as any).insertId,
      status: "pending",
    });
  } catch (err) {
    console.error("Claim error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/airdrop/status/:wallet — 에어드롭 상태 조회
router.get("/status/:wallet", async (req, res) => {
  const { wallet } = req.params;
  const eventName = (req.query.event as string) || "galxe_airdrop";

  try {
    const [rows] = await pool.query(
      "SELECT id, event_name, wallet_address, token_amount, status, requested_at, completed_at, tx_signature FROM event_claims WHERE event_name = ? AND wallet_address = ?",
      [eventName, wallet],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ error: "No claim found" });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
