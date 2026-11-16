import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { isAllowedOrigin, parseAllowedOrigins } from "./security";
import { deviceHub } from "./device-hub";

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = parseAllowedOrigins(process.env.APP_ORIGINS, !isProduction);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin, allowedOrigins)),
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "64kb" }));
app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));
app.use("/api/devices", deviceHub);

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
