import "dotenv/config";
import express from "express";
import cors from "cors";
import airdropRouter from "./routes/airdrop.js";
import authRouter from "./routes/auth.js";
import claimsRouter from "./routes/claims.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Cloud Run(dev·prod)에서는 세션 서명 키 없이 뜨지 않는다. 인스턴스마다 다른 키면 세션이 서로 깨진다.
if ((process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "prod") && (process.env.SESSION_SECRET ?? "").length < 32) {
  console.error("SESSION_SECRET (32+ chars) is required");
  process.exit(1);
}

app.use(cors({
  origin: [
    "https://tina-galxe.heptone.io",
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
app.use("/api/airdrop", airdropRouter);
app.use("/api/auth", authRouter);
app.use("/api/claims", claimsRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
