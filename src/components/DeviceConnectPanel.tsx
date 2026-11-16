import { useEffect, useState } from "react";
import { RadioTower, ShieldCheck, Smartphone, RefreshCw, Unplug } from "lucide-react";

type LinkedDevice = { id: string; name: string; online: boolean; telemetry: { batteryPercent?: number | null; appState?: string; network?: string; lastSeen: number } };
const api = (path: string) => (import.meta.env.VITE_LOW_API_URL || "") + "/api/devices" + path;
const read = async (response: Response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Error de conexión"); return data; };

export function DeviceConnectPanel() {
  const [name, setName] = useState("LOW · " + (/android/i.test(navigator.userAgent) ? "Android" : /iphone|ipad/i.test(navigator.userAgent) ? "iPhone" : "Este dispositivo"));
  const [code, setCode] = useState("");
  const [pairId, setPairId] = useState("");
  const [ownerSecret, setOwnerSecret] = useState("");
  const [claimSecret, setClaimSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [devices, setDevices] = useState<LinkedDevice[]>([]);
  const [status, setStatus] = useState("Sin vínculo activo");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [telemetry, setTelemetry] = useState(true);

  async function startPairing() { setBusy(true); setError(""); try { const data = await read(await fetch(api("/pairings"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceName: name }) })); setPairId(data.pairingId); setCode(data.code); setOwnerSecret(data.ownerSecret); setStatus("Código generado · esperando solicitud del otro dispositivo (5 minutos)"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function claimPairing() { setBusy(true); setError(""); try { const data = await read(await fetch(api("/pairings/claim"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, deviceName: name, consent }) })); setPairId(data.pairingId); setClaimSecret(data.claimSecret); setStatus("Solicitud enviada · falta aprobación en el primer dispositivo"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function approve() { setBusy(true); setError(""); try { const data = await read(await fetch(api("/pairings/" + pairId + "/approve"), { method: "POST", headers: { "x-low-pair-secret": ownerSecret } })); setAccessToken(data.accessToken); setStatus("Vínculo aprobado · telemetría consentida activa"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function checkClaim() { setBusy(true); setError(""); try { const data = await read(await fetch(api("/pairings/" + pairId + "/claim-status"), { headers: { "x-low-claim-secret": claimSecret } })); if (data.state === "approved") { setAccessToken(data.accessToken); setStatus("Vínculo aprobado · telemetría consentida activa"); } else setStatus("Estado: " + data.state + " · esperando aprobación"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function refreshDevices() { if (!accessToken) return; try { const data = await read(await fetch(api("/"), { headers: { Authorization: "Bearer " + accessToken } })); setDevices(data.devices); } catch (e) { setError((e as Error).message); } }
  async function sendHeartbeat() { if (!accessToken || !telemetry) return; try { await read(await fetch(api("/heartbeat"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + accessToken }, body: JSON.stringify({ appState: document.visibilityState === "visible" ? "foreground" : "background", network: navigator.onLine ? "online" : "offline" }) })); } catch (e) { setError((e as Error).message); } }
  async function revoke() { if (!accessToken || !devices[0]) return; setBusy(true); try { await read(await fetch(api("/" + devices[0].id), { method: "DELETE", headers: { Authorization: "Bearer " + accessToken } })); setAccessToken(""); setDevices([]); setStatus("Vínculo revocado en ambos dispositivos"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  useEffect(() => { if (!accessToken) return; void refreshDevices(); void sendHeartbeat(); const timer = window.setInterval(() => { void sendHeartbeat(); void refreshDevices(); }, 30_000); return () => window.clearInterval(timer); }, [accessToken, telemetry]);
  return <div className="device-hub">
    <div className="device-hub-top"><div className="module-icon"><RadioTower/></div><div><b>LOW Sync · vínculo entre equipos</b><small>Emparejamiento mutuo · código temporal · revocación</small></div><span className={accessToken ? "available" : "pending"}>{accessToken ? "VINCULADO" : "SIN VÍNCULO"}</span></div>
    <label>Nombre visible de este equipo</label><input value={name} onChange={(e) => setName(e.target.value)} maxLength={48}/>
    <div className="lab-actions"><button className="primary" onClick={startPairing} disabled={busy}>Generar código para vincular</button></div>
    {code && ownerSecret && <div className="validation ok"><b>Código temporal: {code}</b><small>Comparte este código con tu otro equipo. Caduca en 5 minutos.</small><button className="primary" onClick={approve} disabled={busy || !pairId}>Aprobar solicitud del otro equipo</button></div>}
    <div className="device-options"><div><b>Vincular con un código</b><p>En el segundo equipo, escribe el código generado en el primero.</p><input value={code && !claimSecret ? "" : code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0,8))} placeholder="Código de 8 caracteres" maxLength={8}/><label className="consent-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/> Autorizo compartir únicamente estado de LOW, conectividad y telemetría básica de esta aplicación.</label><button className="secondary" onClick={claimPairing} disabled={busy || !consent || code.length !== 8}>Solicitar vínculo</button>{claimSecret && <button className="secondary" onClick={checkClaim} disabled={busy}>Comprobar aprobación</button>}</div><div><b>Estado del vínculo</b><p>{status}</p>{error && <p className="error-text">{error}</p>}<button className="secondary" onClick={refreshDevices} disabled={!accessToken}>Actualizar dispositivos</button></div></div>
    {accessToken && <><h3>Dispositivos autorizados</h3>{devices.map((d) => <div className="execution-step" key={d.id}><Smartphone/><div><b>{d.name}</b><small>{d.online ? "En línea" : "Sin señal reciente"} · {d.telemetry.network || "Red desconocida"} · {d.telemetry.appState || "Estado desconocido"} · {d.telemetry.batteryPercent == null ? "Batería no compartida" : d.telemetry.batteryPercent + "%"} · Último contacto {new Date(d.telemetry.lastSeen).toLocaleTimeString("es-MX")}</small></div><em>{d.online ? "EN LÍNEA" : "SIN SEÑAL"}</em></div>)}<label className="consent-row"><input type="checkbox" checked={telemetry} onChange={(e) => setTelemetry(e.target.checked)}/> Compartir estado básico de LOW cada 30 segundos</label><button className="secondary" onClick={revoke} disabled={busy}><Unplug size={16}/> Revocar vínculo</button></>}
    <div className="notice"><ShieldCheck size={17}/><p>La observación remota se limita a telemetría declarada por LOW: presencia de la app, conectividad y batería si se añade esa lectura. No hay acceso remoto a pantalla, archivos, ubicación, cámara, micrófono ni control del dispositivo. El vínculo y la telemetría viven en memoria del servidor y se pierden al reiniciarlo.</p></div>
  </div>;
}
