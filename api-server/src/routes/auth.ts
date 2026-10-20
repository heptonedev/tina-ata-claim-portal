import { Router } from "express";
import pool from "../db.js";
import { EVENT_NAME, EVENT_NAMES, getClaimsCloseAt } from "../event.js";
import { GachaUnavailableError, getGachaWallet } from "../gacha.js";
import { exchangeCodeForUser, GalxeUnavailableError, getCampaignIds, getCampaignInfo, getCampaignPoints, isEligible } from "../galxe.js";
import { issueSession } from "../session.js";
import { sessionLimiter } from "../rate-limit.js";

const router = Router();

// GET /api/auth/galxe/campaigns — 로그인 전에도 어떤 Galxe 캠페인이 대상인지와 신청 마감 시각을 보여준다
router.get("/galxe/campaigns", async (_req, res) => {
  const closeAt = getClaimsCloseAt();
  const closesAt = closeAt === null ? null : new Date(closeAt).toISOString();
  if (getCampaignIds().length === 0) {
    res.json({ campaigns: [], closesAt });
    return;
  }
  try {
    res.json({ campaigns: await getCampaignInfo(), closesAt });
  } catch (err) {
    console.error("Galxe campaign info error:", (err as Error).message);
    // 캠페인 정보를 못 불러와도 마감 시각은 보여준다
    res.status(503).json({ error: "Couldn't load the Galxe campaigns.", closesAt });
  }
});

// POST /api/auth/galxe/session — Galxe 로그인 code 로 대상자 여부를 확인하고 신청용 세션을 발급한다
router.post("/galxe/session", sessionLimiter, async (req, res) => {
  const { code } = req.body ?? {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "code is required" });
    return;
  }
  if (getCampaignIds().length === 0) {
    console.error("GALXE_CAMPAIGN_IDS is not configured");
    res.status(503).json({ error: "The airdrop is not open yet." });
    return;
  }

  try {
    const user = await exchangeCodeForUser(code);
    if (!user) {
      res.status(401).json({ error: "Galxe sign-in failed. Sign in again." });
      return;
    }

    const campaigns = await getCampaignPoints(user.addresses);
    const eligible = isEligible(campaigns);
    const points = campaigns.reduce((sum, c) => sum + c.points, 0);

    const [rows] = await pool.query(
      "SELECT id, wallet_address, status, requested_at FROM event_claims WHERE event_name = ? AND galxe_id = ? LIMIT 1",
      [EVENT_NAME, user.galxeId],
    );
    const existing = Array.isArray(rows) && rows.length > 0 ? (rows[0] as Record<string, unknown>) : null;

    const { token } = issueSession("galxe", user.galxeId, eligible ? points : 0);
    console.log(`galxe session: galxeId=${user.galxeId} addresses=${user.addresses.length} eligible=${eligible} claimed=${!!existing}`);

    res.json({
      sessionToken: token,
      galxeId: user.galxeId,
      hasLinkedAddress: user.addresses.length > 0,
      eligible,
      campaigns,
      claim: existing
        ? { walletAddress: existing.wallet_address, status: existing.status, requestedAt: existing.requested_at }
        : null,
    });
  } catch (err) {
    if (err instanceof GalxeUnavailableError) {
      console.error("Galxe unavailable:", err.message);
      res.status(503).json({ error: "Couldn't reach Galxe to check your points. Try again in a minute." });
      return;
    }
    console.error("Galxe session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/gacha/session — 가챠 로그인 토큰으로 가챠 포인트를 확인하고 신청용 세션을 발급한다.
// 가챠 토큰은 가챠 백엔드에 확인만 하고 저장하지 않는다.
router.post("/gacha/session", sessionLimiter, async (req, res) => {
  const { gachaToken } = req.body ?? {};
  if (!gachaToken || typeof gachaToken !== "string" || gachaToken.length > 4096) {
    res.status(400).json({ error: "gachaToken is required" });
    return;
  }

  try {
    const wallet = await getGachaWallet(gachaToken);
    if (!wallet) {
      res.status(401).json({ error: "Your Gacha sign-in has expired. Connect your wallet again." });
      return;
    }

    const [rows] = await pool.query(
      "SELECT wallet_address, status, requested_at FROM event_claims WHERE event_name = ? AND gacha_address = ? LIMIT 1",
      [EVENT_NAMES.gacha, wallet.address],
    );
    const existing = Array.isArray(rows) && rows.length > 0 ? (rows[0] as Record<string, unknown>) : null;

    const { token, session } = issueSession("gacha", wallet.address, wallet.totalPoints);
    console.log(`gacha session: address=${wallet.address} points=${wallet.totalPoints} claimed=${!!existing}`);

    res.json({
      sessionToken: token,
      gachaAddress: wallet.address,
      points: wallet.totalPoints,
      eligible: session.eligible,
      claim: existing
        ? { walletAddress: existing.wallet_address, status: existing.status, requestedAt: existing.requested_at }
        : null,
    });
  } catch (err) {
    if (err instanceof GachaUnavailableError) {
      console.error("Gacha unavailable:", err.message);
      res.status(503).json({ error: "Couldn't reach the Gacha server to check your points. Try again in a minute." });
      return;
    }
    console.error("Gacha session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
