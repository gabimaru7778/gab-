import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.APP_ORIGIN || (isProduction ? false : "http://localhost:5173"),
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "64kb" }));
app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    ok: true,
    service: "LOW",
    version: process.env.npm_package_version || "0.1.0",
    mode: "local-foundation",
    providersConfigured: Boolean(process.env.GLM_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

if (isProduction) {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log("LOW server listening on port " + port);
});
