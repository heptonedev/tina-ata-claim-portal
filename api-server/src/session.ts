import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Galxe 로그인 결과를 신청 단계까지 넘기기 위한 서명된 단기 토큰.
// 서버가 발급·검증만 하므로 브라우저가 내용을 바꾸면 검증에 실패한다.

const SESSION_TTL_MS = 30 * 60 * 1000;

export type ClaimSession = {
  sid: string;
  galxeId: string;
  eligible: boolean;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (32+ chars)");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function issueSession(galxeId: string, eligible: boolean, now = Date.now()): { token: string; session: ClaimSession } {
  const session: ClaimSession = {
    sid: randomBytes(16).toString("hex"),
    galxeId,
    eligible,
    exp: now + SESSION_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, session };
}

/** 위조·만료된 토큰이면 null. */
export function verifySession(token: unknown, now = Date.now()): ClaimSession | null {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as ClaimSession;
    if (typeof session.exp !== "number" || session.exp < now) return null;
    return session;
  } catch {
    return null;
  }
}
