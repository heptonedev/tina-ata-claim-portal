import "dotenv/config";
import express from "express";
import cors from "cors";
import airdropRouter from "./routes/airdrop.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cors({
  origin: [
    "https://tina-galxe.heptone.io",
    "http://localhost:5173",
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
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`, JSON.stringify(body));
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

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
