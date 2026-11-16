import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";

type Telemetry = { batteryPercent?: number | null; appState?: "foreground" | "background" | "idle"; network?: "online" | "offline"; lastSeen: number };
type Device = { id: string; name: string; tokenHash: string; linkId: string; telemetry: Telemetry; revoked: boolean };
type Pairing = { id: string; codeHash: string; ownerSecretHash: string; claimSecretHash?: string; ownerName: string; claimantName?: string; expiresAt: number; state: "pending" | "claimed" | "approved" | "rejected"; ownerDeviceId?: string; claimantDeviceId?: string; ownerToken?: string; claimantToken?: string };
const pairings = new Map<string, Pairing>();
const devices = new Map<string, Device>();
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const matchesHash = (value: string | undefined, expectedHash: string | undefined) => { if (!value || !expectedHash) return false; const actual = Buffer.from(hash(value)); const expected = Buffer.from(expectedHash); return actual.length === expected.length && timingSafeEqual(actual, expected); };
const cleanName = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 48) : "";
const bearer = (req: Request) => req.header("authorization")?.replace(/^Bearer\s+/i, "");
function getDevice(req: Request) { const supplied = bearer(req); return [...devices.values()].find((d) => !d.revoked && supplied && matchesHash(supplied, d.tokenHash)); }
function authPair(req: Request, res: Response, pair: Pairing, kind: "owner" | "claim") {
  const supplied = req.header(kind === "owner" ? "x-low-pair-secret" : "x-low-claim-secret");
  const expected = kind === "owner" ? pair.ownerSecretHash : pair.claimSecretHash;
  if (!supplied || !expected || !matchesHash(supplied, expected)) { res.status(401).json({ error: "No autorizado" }); return false; }
  return true;
}
function expirePairs() { const now = Date.now(); for (const [id, p] of pairings) if (p.expiresAt < now && p.state !== "approved") pairings.delete(id); }
export const deviceHub = Router();

deviceHub.post("/pairings", (req, res) => {
  expirePairs();
  const ownerName = cleanName(req.body?.deviceName);
  if (!ownerName) return res.status(400).json({ error: "Indica un nombre de dispositivo" });
  const id = randomUUID(), code = randomBytes(4).toString("hex").toUpperCase(), ownerSecret = token();
  pairings.set(id, { id, codeHash: hash(code), ownerSecretHash: hash(ownerSecret), ownerName, expiresAt: Date.now() + 5 * 60_000, state: "pending" });
  res.setHeader("Cache-Control", "no-store");
  return res.status(201).json({ pairingId: id, code, ownerSecret, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(), expiresInSeconds: 300 });
});

deviceHub.post("/pairings/claim", (req, res) => {
  expirePairs();
  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  const deviceName = cleanName(req.body?.deviceName);
  if (!/^[A-F0-9]{8}$/.test(code) || !deviceName || req.body?.consent !== true) return res.status(400).json({ error: "Código, nombre y consentimiento explícito son obligatorios" });
  const pair = [...pairings.values()].find((p) => p.state === "pending" && p.expiresAt > Date.now() && matchesHash(code, p.codeHash));
  if (!pair) return res.status(404).json({ error: "Código inválido o expirado" });
  const claimSecret = token();
  pair.state = "claimed"; pair.claimSecretHash = hash(claimSecret); pair.claimantName = deviceName;
  res.setHeader("Cache-Control", "no-store");
  return res.status(202).json({ pairingId: pair.id, claimSecret, state: pair.state, awaitingOwnerApproval: true });
});

deviceHub.post("/pairings/:id/approve", (req, res) => {
  const pair = pairings.get(req.params.id);
  if (!pair || pair.expiresAt < Date.now() || pair.state !== "claimed") return res.status(404).json({ error: "Solicitud no disponible" });
  if (!authPair(req, res, pair, "owner")) return;
  const ownerToken = token(), claimantToken = token(), linkId = randomUUID();
  const ownerId = randomUUID(), claimantId = randomUUID();
  const initial: Telemetry = { lastSeen: Date.now(), network: "online", appState: "foreground" };
  devices.set(ownerId, { id: ownerId, name: pair.ownerName, tokenHash: hash(ownerToken), linkId, telemetry: initial, revoked: false });
  devices.set(claimantId, { id: claimantId, name: pair.claimantName || "Dispositivo", tokenHash: hash(claimantToken), linkId, telemetry: initial, revoked: false });
  pair.state = "approved"; pair.ownerDeviceId = ownerId; pair.claimantDeviceId = claimantId;
  pair.ownerToken = ownerToken; pair.claimantToken = claimantToken;
  res.setHeader("Cache-Control", "no-store");
  return res.json({ state: "approved", deviceId: ownerId, accessToken: ownerToken, linkedDevice: pair.claimantName });
});

deviceHub.get("/pairings/:id/claim-status", (req, res) => {
  const pair = pairings.get(req.params.id);
  if (!pair || !authPair(req, res, pair, "claim")) return;
  res.setHeader("Cache-Control", "no-store");
  if (pair.state !== "approved" || !pair.claimantToken) return res.json({ state: pair.state });
  const accessToken = pair.claimantToken; pair.claimantToken = undefined;
  return res.json({ state: "approved", deviceId: pair.claimantDeviceId, accessToken, linkedDevice: pair.ownerName });
});

deviceHub.post("/heartbeat", (req, res) => {
  const device = getDevice(req);
  if (!device) return res.status(401).json({ error: "Dispositivo no autorizado o vínculo revocado" });
  const allowedKeys = new Set(["batteryPercent", "appState", "network"]);
  if (Object.keys(req.body || {}).some((key) => !allowedKeys.has(key))) return res.status(400).json({ error: "Campo de telemetría no permitido" });
  const battery = req.body?.batteryPercent;
  const appState = req.body?.appState;
  const network = req.body?.network;
  if (battery !== undefined && battery !== null && (!Number.isInteger(battery) || battery < 0 || battery > 100)) return res.status(400).json({ error: "Batería inválida" });
  if (appState !== undefined && !["foreground", "background", "idle"].includes(appState)) return res.status(400).json({ error: "Estado de aplicación inválido" });
  if (network !== undefined && !["online", "offline"].includes(network)) return res.status(400).json({ error: "Estado de red inválido" });
  device.telemetry = { batteryPercent: battery ?? device.telemetry.batteryPercent, appState: appState ?? device.telemetry.appState, network: network ?? device.telemetry.network, lastSeen: Date.now() };
  return res.json({ ok: true, receivedAt: new Date(device.telemetry.lastSeen).toISOString() });
});

deviceHub.get("/", (req, res) => {
  const device = getDevice(req);
  if (!device) return res.status(401).json({ error: "Dispositivo no autorizado" });
  const linked = [...devices.values()].filter((d) => d.linkId === device.linkId && d.id !== device.id && !d.revoked);
  return res.json({ devices: linked.map((d) => ({ id: d.id, name: d.name, telemetry: d.telemetry, online: Date.now() - d.telemetry.lastSeen < 90_000 })) });
});

deviceHub.delete("/:deviceId", (req, res) => {
  const device = getDevice(req);
  if (!device) return res.status(401).json({ error: "Dispositivo no autorizado" });
  const target = devices.get(req.params.deviceId);
  if (!target || target.linkId !== device.linkId) return res.status(404).json({ error: "Dispositivo no encontrado en este vínculo" });
  for (const d of devices.values()) if (d.linkId === device.linkId) d.revoked = true;
  return res.json({ ok: true, revoked: true, message: "Vínculo revocado para ambos dispositivos" });
});
