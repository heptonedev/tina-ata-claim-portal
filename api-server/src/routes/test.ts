import { Router } from "express";
import pool from "../db.js";
import { EVENT_NAMES } from "../event.js";
import { verifySession } from "../session.js";

// 개발 서버 전용 테스트 기능. index.ts 가 NODE_ENV=dev 이고 ALLOW_TEST_RESET=true 일 때만 연결한다.
// 운영에는 이 경로가 존재하지 않는다.

export const TEST_RESET_ENABLED = process.env.NODE_ENV === "dev" && process.env.ALLOW_TEST_RESET === "true";

const router = Router();

// POST /api/test/reset-claim — 지금 로그인한 계정(Galxe ID 또는 가챠 지갑)의 신청 기록을 지워 다시 신청할 수 있게 한다.
// 다른 계정의 기록은 지울 수 없다 (세션 토큰의 계정으로만 지운다).
router.post("/reset-claim", async (req, res) => {
  const session = verifySession(req.body?.sessionToken);
  if (!session) {
    res.status(401).json({ error: "Your sign-in has expired. Sign in again." });
    return;
  }
  const accountColumn = session.source === "gacha" ? "gacha_address" : "galxe_id";
  try {
    const [result] = await pool.query(
      `DELETE FROM event_claims WHERE event_name = ? AND ${accountColumn} = ? AND status = 'pending' AND tx_signature IS NULL`,
      [EVENT_NAMES[session.source], session.account],
    );
    const deleted = (result as { affectedRows: number }).affectedRows;
    console.log(`test reset-claim: source=${session.source} account=${session.account} deleted=${deleted}`);
    res.json({ deleted });
  } catch (err) {
    console.error("Test reset error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
