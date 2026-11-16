import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-6-cyber";
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.APP_ORIGIN || (isProduction ? false : "http://localhost:5173"),
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "32kb" }));
app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

const ReviewSchema = z.object({
  projectName: z.string().trim().min(1).max(80),
  scope: z.string().trim().min(8).max(500),
  context: z.string().trim().max(4000).default(""),
  objective: z.enum([
    "Revisión de configuración",
    "Revisión de código",
    "Dependencias y cadena de suministro",
    "Plan de endurecimiento"
  ]),
  authorizationConfirmed: z.literal(true)
}).strict();

const systemInstructions = [
  "Eres un asistente de ciberseguridad defensiva. Responde en español y con precisión.",
  "Trabaja únicamente en revisión pasiva de código, configuración, dependencias y recomendaciones de mitigación.",
  "No ejecutes herramientas, comandos, escaneos, conexiones de red ni acciones sobre objetivos.",
  "No proporciones malware, robo de credenciales, phishing, persistencia, evasión, explotación paso a paso, payloads operativos ni instrucciones para comprometer sistemas.",
  "No amplíes el alcance declarado. Nunca afirmes haber escaneado, probado o verificado un activo si solo recibiste texto.",
  "Si faltan evidencias, indícalo claramente. No solicites secretos ni datos personales.",
  "Devuelve un informe con: alcance declarado, resumen, observaciones (separando hechos de hipótesis), riesgo cualitativo, recomendaciones priorizadas, evidencias faltantes y validación humana sugerida.",
  "No inventes CVE, versiones, resultados ni vulnerabilidades."
].join("\n");

function demoReport(projectName: string, objective: string): string {
  return "# Revisión preliminar · " + projectName +
    "\n\n**Modo:** demostración local" +
    "\n**Objetivo:** " + objective +
    "\n\n## Resumen\nEl servidor funciona, pero no tiene un proveedor de IA configurado. Este informe es una plantilla de referencia; no representa un análisis del activo." +
    "\n\n## Controles básicos\n1. Confirma el inventario, propietario y límites del activo.\n2. Activa MFA y aplica privilegio mínimo.\n3. Revisa dependencias, versiones soportadas y procedencia de paquetes.\n4. Evita secretos en el código; usa un gestor de secretos.\n5. Habilita registros, alertas, copias de seguridad y recuperación probada." +
    "\n\n## Evidencia necesaria\nComparte solo código o configuración saneada, sin tokens, contraseñas ni información personal." +
    "\n\n## Estado\nNo se ejecutaron escaneos, comandos ni pruebas sobre sistemas.";
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mode: apiKey ? "live" : "demo",
    model: apiKey ? model : "Plantilla local · proveedor no configurado"
  });
});

app.post("/api/cyber/review", async (req, res) => {
  const parsed = ReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos. Confirma autorización e indica un alcance válido." });
    return;
  }

  const input = parsed.data;
  if (!apiKey) {
    res.json({
      mode: "demo",
      model: "Plantilla local",
      report: demoReport(input.projectName, input.objective)
    });
    return;
  }

  try {
    const prompt = [
      "Proyecto: " + input.projectName,
      "Alcance declarado por el usuario: " + input.scope,
      "Objetivo: " + input.objective,
      "Contexto saneado: " + (input.context || "No proporcionado"),
      "El usuario ha confirmado que tiene autorización. No realices acciones sobre el activo; analiza únicamente la información textual proporcionada."
    ].join("\n");

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: systemInstructions,
        input: prompt,
        max_output_tokens: 3000
      }),
      signal: AbortSignal.timeout(90_000)
    });

    const payload = await upstream.json() as {
      output_text?: string;
      error?: { message?: string };
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    if (!upstream.ok) {
      const message = payload.error?.message || "El proveedor rechazó la solicitud.";
      res.status(upstream.status >= 500 ? 502 : upstream.status).json({ error: message });
      return;
    }

    const extracted = payload.output_text || (payload.output || [])
      .flatMap((item) => item.content || [])
      .filter((part) => part.type === "output_text" && part.text)
      .map((part) => part.text)
      .join("\n");

    if (!extracted) {
      res.status(502).json({ error: "El proveedor no devolvió un informe de texto." });
      return;
    }

    res.json({ mode: "live", model, report: extracted });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Error de conexión con el proveedor.";
    res.status(502).json({ error: message });
  }
});

if (isProduction) {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log("Cyber Lab server listening on port " + port);
});