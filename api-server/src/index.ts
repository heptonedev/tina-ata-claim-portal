import "dotenv/config";
import express from "express";
import cors from "cors";
import airdropRouter from "./routes/airdrop.js";
import authRouter from "./routes/auth.js";
import claimsRouter from "./routes/claims.js";
import testRouter, { TEST_RESET_ENABLED } from "./routes/test.js";
import { apiLimiter } from "./rate-limit.js";
import { claimsCloseAtInvalid, getClaimsCloseAt } from "./event.js";

const app = express();
// Cloud Run 앞단(Google Front End)이 X-Forwarded-For 맨 끝에 실제 접속 IP 를 붙인다.
// 1 hop 만 믿어서 사용자가 직접 넣은 X-Forwarded-For 값으로 IP 를 속일 수 없게 한다.
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 8080;

// Cloud Run(dev·prod)에서는 세션 서명 키 없이 뜨지 않는다. 인스턴스마다 다른 키면 세션이 서로 깨진다.
if ((process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "prod") && (process.env.SESSION_SECRET ?? "").length < 32) {
  console.error("SESSION_SECRET (32+ chars) is required");
  process.exit(1);
}

// 운영은 신청 마감 시각 없이 뜨지 않는다. 값이 빠지거나 잘못되면 마감 없이 신청을 받게 되기 때문이다.
if (process.env.NODE_ENV === "prod" && getClaimsCloseAt() === null) {
  console.error("CLAIMS_CLOSE_AT (valid ISO date) is required in prod");
  process.exit(1);
}
if (claimsCloseAtInvalid()) {
  console.error(`CLAIMS_CLOSE_AT is not a valid date: claims are blocked until it is fixed`);
}

app.use(cors({
  origin: [
    "https://tina-galxe.heptone.io",
    "https://tina-galxe-dev.web.app", // Firebase 개발 사이트
    "http://localhost:5173",
    // 홈페이지 가챠 이벤트 페이지의 에어드롭 신청 (운영 tina.im, 개발 Firebase, 로컬)
    "https://tina.im",
    "https://www.tina.im",
    "https://tinaim.web.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(express.json());

// Request/Response logging
app.use((req, res, next) => {
  if (req.path === "/health") return next();

  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    const ms = Date.now() - start;
    // 세션 토큰은 로그에 남기지 않는다
    const logged = body && typeof body === "object" && "sessionToken" in body ? { ...body, sessionToken: "***" } : body;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`, JSON.stringify(logged));
    return originalJson(body);
  };
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api", apiLimiter);
app.use("/api/airdrop", airdropRouter);
app.use("/api/auth", authRouter);
app.use("/api/claims", claimsRouter);
// 개발 서버 테스트용 신청 초기화 (운영에는 연결하지 않는다)
if (TEST_RESET_ENABLED) {
  app.use("/api/test", testRouter);
  console.log("Test routes enabled: POST /api/test/reset-claim");
}

// 잘못된 JSON 등 처리 중 오류. NODE_ENV 가 Express 의 production 이 아니라서 기본 처리기는 스택이 담긴 HTML 을 돌려준다.
app.use((err: { status?: number; statusCode?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 400 && status < 500) {
    res.status(status).json({ error: "Invalid request" });
    return;
  }
  console.error(`${req.method} ${req.originalUrl} failed:`, err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
