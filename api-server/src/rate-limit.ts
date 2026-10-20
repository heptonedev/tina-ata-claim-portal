import rateLimit, { type Options } from "express-rate-limit";

// IP 당 요청 횟수 제한. Cloud Run 인스턴스마다 따로 센다 (인스턴스가 늘면 한도도 그만큼 느슨해진다).
// 통신사 NAT 처럼 여러 사람이 한 IP 를 쓰는 경우를 생각해 넉넉하게 잡는다.
// IP 는 index.ts 의 trust proxy 설정으로 Cloud Run 이 붙인 실제 접속 IP 를 쓴다 (사용자가 보낸 X-Forwarded-For 는 무시).

const base: Partial<Options> = {
  windowMs: 60 * 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Wait a minute and try again." },
};

/** API 전체: IP 당 분당 300회 */
export const apiLimiter = rateLimit({ ...base, limit: 300 });

/** 로그인 세션 발급(Galxe·가챠 서버를 부르는 경로): IP 당 분당 30회 */
export const sessionLimiter = rateLimit({ ...base, limit: 30 });

/** 신청: IP 당 분당 20회 */
export const claimLimiter = rateLimit({ ...base, limit: 20 });
