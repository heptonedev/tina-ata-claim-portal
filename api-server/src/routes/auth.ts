import { Router } from "express";
import pool from "../db.js";

const router = Router();

const GALXE_CLIENT_ID = process.env.GALXE_CLIENT_ID || "2129a0a0f3b7f593e9923cfd745dd665af85fb166b5a4cf93ebeda38ea58b84f";
const GALXE_CLIENT_SECRET = process.env.GALXE_CLIENT_SECRET || "";
const GALXE_TOKEN_URL = "https://api.galxe.com/oauth/auth/2/token";
const GALXE_USER_URL = "https://api.galxe.com/oauth/api/2/user";

const ALL_SCOPES = "GalxeID SolanaAddress EVMAddress Email Twitter Discord Github Telegram";

// POST /api/auth/galxe/verify — Galxe OAuth code 검증 + 에어드롭 신청
router.post("/galxe/verify", async (req, res) => {
  const { code, walletAddress } = req.body;

  if (!code || !walletAddress) {
    res.status(400).json({ error: "code and walletAddress are required" });
    return;
  }

  try {
    // 1. code → access_token 교환
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

    // 2. 사용자 정보 전체 조회
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

    const galxeId = userData.GalxeID || null;

    // GalxeID 제외한 나머지를 galxe_user_data JSON으로 저장
    const { GalxeID, ...userDataWithoutId } = userData;

    // 3. 중복 신청 확인
    const eventName = "galxe_airdrop";
    const [existing] = await pool.query(
      "SELECT id, status FROM event_claims WHERE event_name = ? AND wallet_address = ?",
      [eventName, walletAddress],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      res.status(409).json({ error: "Airdrop already claimed", claim: existing[0] });
      return;
    }

    // 4. 에어드롭 신청 저장
    const [result] = await pool.query(
      `INSERT INTO event_claims (event_name, wallet_address, galxe_id, galxe_user_data, token_amount, status, requested_at)
       VALUES (?, ?, ?, ?, 0, 'pending', NOW())`,
      [eventName, walletAddress, galxeId, JSON.stringify(userDataWithoutId)],
    );

    res.status(201).json({
      message: "Airdrop claim submitted",
      claimId: (result as any).insertId,
      status: "pending",
      galxeId,
    });
  } catch (err) {
    console.error("Galxe verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
