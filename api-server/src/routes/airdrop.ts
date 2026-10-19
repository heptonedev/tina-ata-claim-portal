import { Router } from "express";
import pool from "../db.js";

const router = Router();

// 신청은 Galxe 로그인 + 지갑 서명을 거치는 POST /api/auth/galxe/verify 로만 받는다.
// (예전 POST /api/airdrop/claim 은 Galxe 없이 신청되고 수량을 신청자가 정할 수 있어 제거)

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
