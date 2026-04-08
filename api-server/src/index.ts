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

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/airdrop", airdropRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
