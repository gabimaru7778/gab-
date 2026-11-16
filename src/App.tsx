import { useEffect, useMemo, useState, type FormEvent } from "react";
import { validateCsv, validateJson } from "./lib/validators";
import { detectDeviceCapabilities, describeConnectionCommand, recommendTransports } from "./lib/device-link";
import { simulateAuthLab, type AuthLabMode, type AuthLabResult } from "./lib/academy-lab";
import { buildWifiScenario, buildWifiExecutionTrace, simulateStealthDetection, simulateSensorConsent, simulateEmergencyShutdown, type LabSensor, type WifiLabProfile, type WifiLabScenario, type ExecutionStep, type LabEvent } from "./lib/academy-network";
import {
  Activity, ArrowUpRight, AudioLines, Bot, CheckCircle2, ChevronRight,
  Code2, Cpu, Database, FileCheck2, FileJson, FileText, Globe2,
  Github, HardDrive, Image, Layers3, LockKeyhole, Menu, Mic2, Network,
  RadioTower, RefreshCw, ScanLine, Search, Send, Settings2, ShieldCheck,
  Sparkles, Wifi, X, Zap
} from "lucide-react";

type Section = "overview" | "assistant" | "network" | "devices" | "data" | "developer" | "agents" | "creator" | "lab" | "settings";
type NetworkResult = { online: boolean; latencyMs: number | null; checkedAt: string; api: string };
type ValidationResult = { valid: boolean; message: string; details: string[] };

const modules = [
  { id: "assistant", title: "LOW CORE", desc: "Asistente central y contexto de trabajo", icon: Bot, status: "INTERFAZ LISTA" },
  { id: "agents", title: "AGENTS", desc: "Agentes, tareas y ejecución coordinada", icon: Layers3, status: "POR CONECTAR" },
  { id: "developer", title: "DEVELOPER", desc: "GitHub, repositorios, PR y Actions", icon: Github, status: "POR CONECTAR" },
  { id: "network", title: "NETWORK", desc: "Conectividad y diagnóstico de red", icon: Network, status: "DIAGNÓSTICO LOCAL" },
  { id: "data", title: "DATA", desc: "Validación y calidad de datos", icon: Database, status: "HERRAMIENTA LOCAL" },
  { id: "creator", title: "CREATOR", desc: "Imagen, audio, vídeo y documentos", icon: Image, status: "POR CONECTAR" },
  { id: "lab", title: "ACADEMY LAB", desc: "Simulaciones académicas aisladas y reproducibles", icon: ShieldCheck, status: "SIMULACIÓN LOCAL" }
] as const;

export default function App() {
  const [section, setSection] = useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [networkResult, setNetworkResult] = useState<NetworkResult | null>(null);
  const [networkBusy, setNetworkBusy] = useState(false);
  const [devicePlan, setDevicePlan] = useState<string>("Aún no se ha analizado este dispositivo.");
  const deviceCapabilities = useMemo(() => detectDeviceCapabilities({ userAgent: navigator.userAgent, online: navigator.onLine, canShare: typeof navigator.share === "function", canUseBluetooth: "bluetooth" in navigator, canUseCamera: !!navigator.mediaDevices?.getUserMedia }), [online]);
  const [jsonText, setJsonText] = useState('{\n  "name": "LOW",\n  "version": "0.1.0",\n  "active": true\n}');
  const [requiredFields, setRequiredFields] = useState("name, version");
  const [csvText, setCsvText] = useState("id,name,status\n1,LOW,active\n2,Agent,planned");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [csvValidation, setCsvValidation] = useState<ValidationResult | null>(null);
  const [message, setMessage] = useState("");
  const [labMode, setLabMode] = useState<AuthLabMode>("parameterized");
  const [labUser, setLabUser] = useState("ana");
  const [labPassword, setLabPassword] = useState("demo-123");
  const [labResult, setLabResult] = useState<AuthLabResult | null>(null);
  const [wifiProfile, setWifiProfile] = useState<WifiLabProfile>("home");
  const [wifiScenario, setWifiScenario] = useState<WifiLabScenario | null>(null);
  const [executionTrace, setExecutionTrace] = useState<ExecutionStep[]>([]);
  const [executionIndex, setExecutionIndex] = useState(-1);
  const [defenseEvents, setDefenseEvents] = useState<LabEvent[]>([]);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [sensorEvents, setSensorEvents] = useState<LabEvent[]>([]);
  const [showLabCode, setShowLabCode] = useState(false);
  const [autoRunLab, setAutoRunLab] = useState(false);
  const [messages, setMessages] = useState<string[]>(["Hola. Soy LOW. Mi interfaz principal está lista; conecta un proveedor de modelos desde la configuración del servidor para habilitar respuestas inteligentes."]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => {
    if (!autoRunLab) return;
    const timer = window.setInterval(() => {
      setExecutionIndex((current) => {
        if (current >= executionTrace.length - 1) {
          setAutoRunLab(false);
          return current;
        }
        const next = current + 1;
        setExecutionTrace((steps) => steps.map((step, index) => ({ ...step, status: index <= next ? "completed" : "planned" })));
        setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Ejecución en directo: paso " + (next + 1)]);
        return next;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [autoRunLab, executionTrace.length]);

  async function runNetworkCheck() {
    setNetworkBusy(true);
    const started = performance.now();
    try {
      const apiBase = import.meta.env.VITE_LOW_API_URL || "";
      const response = await fetch(apiBase + "/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("API respondió con HTTP " + response.status);
      const data = await response.json() as { ok?: boolean; mode?: string };
      setNetworkResult({ online: navigator.onLine, latencyMs: Math.round(performance.now() - started), checkedAt: new Date().toLocaleString("es-MX"), api: data.ok ? "Disponible · " + (data.mode || "servicio") : "Respuesta inesperada" });
    } catch {
      setNetworkResult({ online: navigator.onLine, latencyMs: null, checkedAt: new Date().toLocaleString("es-MX"), api: "No se pudo alcanzar la API de LOW" });
    } finally { setNetworkBusy(false); }
  }

  function handleValidate(event: FormEvent) {
    event.preventDefault();
    setValidation(validateJson(jsonText, requiredFields));
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessages((current) => [...current, "Tú: " + text, "LOW: El módulo de conversación está preparado visualmente. Para responder con un modelo real, configura un proveedor en el servidor; no se enviará tu texto a un servicio sin esa conexión."]);
    setMessage("");
  }

  const currentTitle = useMemo(() => ({
    overview: "Centro de mando", assistant: "LOW CORE", network: "Diagnóstico de red", devices: "Conectar dispositivos",
    data: "Validación de datos", developer: "GitHub Developer", agents: "Agentes y trabajos",
    creator: "Centro creativo", lab: "Laboratorio académico", settings: "Configuración"
  } as Record<Section, string>)[section], [section]);

  const nav = [
    ["overview", "Centro de mando", Activity], ["assistant", "LOW CORE", Bot],
    ["agents", "Agentes", Layers3], ["developer", "GitHub", Github],
    ["network", "Redes", Network], ["devices", "Dispositivos", RadioTower], ["data", "Datos", Database],
    ["creator", "Creator", Sparkles], ["lab", "Academy Lab", ShieldCheck], ["settings", "Configuración", Settings2]
  ] as const;

  function go(target: Section) { setSection(target); setMenuOpen(false); }

  return (
    <div className="low-shell">
      <aside className={"sidebar" + (menuOpen ? " open" : "")}>
        <div className="brand-row"><div className="brand-symbol"><span /></div><div><b>LOW</b><small>PERSONAL INTELLIGENCE</small></div><button className="icon-btn close-nav" onClick={() => setMenuOpen(false)} aria-label="Cerrar"><X /></button></div>
        <div className="nav-caption">ESPACIO PERSONAL</div>
        <nav>{nav.map(([id, label, Icon]) => <button key={id} className={"nav-link" + (section === id ? " selected" : "")} onClick={() => go(id)}><Icon size={17} /><span>{label}</span>{section === id && <ChevronRight size={15} />}</button>)}</nav>
        <div className="sidebar-footer"><div className="secure-note"><ShieldCheck size={17}/><div><b>Privacidad primero</b><small>Herramientas locales sin enviar datos a terceros.</small></div></div><div className="version">LOW BUILD 0.1 · FOUNDATION</div></div>
      </aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Cerrar navegación" />}
      <main className="main">
        <header className="topbar"><button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir navegación"><Menu /></button><div className="crumb">LOW <span>/</span> <b>{currentTitle}</b></div><div className="top-status"><i className={online ? "dot good" : "dot bad"} />{online ? "DISPOSITIVO CONECTADO" : "SIN CONEXIÓN"}</div></header>
        <div className="content">
          {section === "overview" && <>
            <section className="hero"><div className="hero-text"><div className="eyebrow"><span className="pulse"/> SISTEMA PERSONAL MULTIMODELO</div><h1>Tu inteligencia.<br/><em>Tu centro de control.</em></h1><p>LOW reúne tus herramientas, agentes, modelos y flujos de trabajo en un solo espacio. No es solo un chat: es tu entorno de operaciones personal.</p><button className="primary" onClick={() => go("assistant")}>Abrir LOW CORE <ArrowUpRight size={16}/></button></div><div className="orb-stage"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orb"><div className="orb-inner"><span>LOW</span></div></div><div className="orb-label">CORE INTELLIGENCE <b>READY FOR CONNECTIONS</b></div></div></section>
            <div className="stats"><div><span>ESTADO DEL SISTEMA</span><b><i className="dot good"/> Interfaz operativa</b><small>Herramientas locales disponibles</small></div><div><span>CONEXIÓN</span><b><i className={"dot " + (online ? "good" : "bad")}/>{online ? "En línea" : "Sin conexión"}</b><small>Estado del navegador</small></div><div><span>PROVEEDORES IA</span><b>0 conectados</b><small>Requiere configuración segura</small></div><div><span>AGENTES ACTIVOS</span><b>0 ejecutándose</b><small>Motor de agentes pendiente</small></div></div>
            <div className="section-title"><div><div className="eyebrow">ARQUITECTURA MODULAR</div><h2>Herramientas de LOW</h2><p>Abre un módulo para usar sus herramientas o revisar su estado.</p></div><span>07 MÓDULOS</span></div>
            <div className="module-grid">{modules.map((module) => { const Icon = module.icon; return <button className="module-card" key={module.id} onClick={() => go(module.id as Section)}><div className="module-icon"><Icon size={19}/></div><div className="module-status">{module.status}</div><h3>{module.title}</h3><p>{module.desc}</p><span className="module-open">Abrir módulo <ArrowUpRight size={14}/></span></button>; })}</div>
            <div className="notice"><LockKeyhole size={17}/><p><b>Estado transparente:</b> el panel y las herramientas locales funcionan. GitHub, modelos, voz, agentes y creación multimedia aparecen como pendientes hasta conectar y probar cada servicio.</p></div>
          </>}
          {section === "assistant" && <section className="tool-page"><div className="eyebrow">LOW CORE / CONVERSACIÓN</div><h1>Habla con LOW</h1><p className="lead">Interfaz de conversación lista. El proveedor de IA se conecta desde el backend; no guardamos claves en el navegador.</p><div className="chat-box"><div className="chat-head"><div className="module-icon"><Bot/></div><div><b>LOW CORE</b><small>Proveedor: sin conectar</small></div><span className="pending">NECESITA CONEXIÓN</span></div><div className="chat-messages">{messages.map((item, i) => <div className={item.startsWith("Tú:") ? "bubble user" : "bubble"} key={i}>{item}</div>)}</div><form className="chat-input" onSubmit={sendMessage}><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe una instrucción para LOW..." maxLength={4000}/><button className="primary" type="submit" aria-label="Enviar"><Send size={17}/></button></form></div><div className="notice"><Cpu size={17}/><p>La conversación funciona como interfaz local; las respuestas inteligentes requieren configurar un adaptador de modelo y su credencial en el servidor.</p></div></section>}
          {section === "network" && <section className="tool-page"><div className="eyebrow">LOW NETWORK / CONECTIVIDAD</div><h1>Diagnóstico de red</h1><p className="lead">Comprueba la conexión del dispositivo y la disponibilidad de la API de LOW. No se escanean redes ni dispositivos ajenos.</p><div className="network-card"><div className="network-visual"><Wifi size={34}/><span>{online ? "CONECTADO" : "DESCONECTADO"}</span></div><div className="network-details"><div><span>Dispositivo</span><b>{online ? "Navegador en línea" : "Navegador sin conexión"}</b></div><div><span>API LOW</span><b>{networkResult?.api || "Sin comprobar"}</b></div><div><span>Latencia API</span><b>{networkResult?.latencyMs == null ? "—" : networkResult.latencyMs + " ms"}</b></div><div><span>Última comprobación</span><b>{networkResult?.checkedAt || "—"}</b></div></div><button className="primary" onClick={runNetworkCheck} disabled={networkBusy}>{networkBusy ? <RefreshCw className="spin"/> : <RadioTower/>}{networkBusy ? "Comprobando..." : "Comprobar conexión"}</button></div><div className="notice"><ShieldCheck size={17}/><p>Esta prueba mide la disponibilidad del propio servicio LOW. Las pruebas avanzadas de LAN o redes propias se habilitarán con permisos explícitos, límites y registro de actividad.</p></div></section>}
          {section === "devices" && <section className="tool-page"><div className="eyebrow">LOW CONNECT / MULTIDISPOSITIVO</div><h1>Conecta tus dispositivos</h1><p className="lead">Una sola orden. LOW detecta la plataforma y recomienda la vía compatible: QR, red local, Bluetooth nativo o relay seguro.</p><div className="device-hub"><div className="device-hub-top"><div className="module-icon"><RadioTower/></div><div><b>Asistente de conexión adaptable</b><small>Plataforma detectada: {deviceCapabilities.platform.toUpperCase()}</small></div><span className="pending">MODO PREPARACIÓN</span></div><button className="primary" onClick={() => setDevicePlan(describeConnectionCommand(deviceCapabilities))}><Zap size={16}/> LOW, conecta este dispositivo</button><div className="device-plan">{devicePlan}</div><div className="device-options">{recommendTransports(deviceCapabilities).map((option) => <div key={option.id}><b>{option.id === "qr-link" ? "QR / enlace" : option.id === "local-network" ? "Red local" : option.id === "bluetooth" ? "Bluetooth" : "Relay seguro"}</b><span className={option.state === "ready" ? "available" : "unavailable"}>{option.state === "ready" ? "Listo" : option.state === "needs-service" ? "Requiere LOW Sync" : option.state === "needs-agent" ? "Requiere agente remoto" : option.state === "needs-native-bridge" ? "Requiere puente nativo" : "No compatible"}</span><p>{option.reason}</p></div>)}</div></div><div className="notice"><ShieldCheck size={17}/><p><b>Importante:</b> esta pantalla detecta capacidades y recomienda una ruta, pero distingue eso de una conexión real. LOW Sync, el agente remoto y el puente nativo aún deben desplegarse e integrarse. Ningún equipo se marca como vinculado hasta completar un emparejamiento autenticado y aprobado por ambas partes.</p></div></section>}
          {section === "data" && <section className="tool-page"><div className="eyebrow">LOW DATA / CALIDAD DE INFORMACIÓN</div><h1>Valida tus datos</h1><p className="lead">Comprueba estructura JSON y consistencia básica de CSV directamente en tu dispositivo.</p><div className="validator-grid"><form className="validator-card" onSubmit={handleValidate}><div className="card-head"><FileJson/><div><b>Validador JSON</b><small>Sintaxis y campos requeridos</small></div></div><label>JSON a validar</label><textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false}/><label>Campos obligatorios (separados por coma)</label><input value={requiredFields} onChange={(e) => setRequiredFields(e.target.value)}/><button className="primary" type="submit"><FileCheck2 size={16}/> Validar JSON</button>{validation && <div className={"validation " + (validation.valid ? "ok" : "fail")}><b>{validation.message}</b>{validation.details.map((line, i) => <small key={i}>{line}</small>)}</div>}</form><div className="validator-card"><div className="card-head"><FileText/><div><b>Validador CSV</b><small>Encabezados y número de columnas</small></div></div><label>Contenido CSV</label><textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} spellCheck={false}/><button className="primary" onClick={() => setCsvValidation(validateCsv(csvText))}><FileCheck2 size={16}/> Validar CSV</button>{csvValidation && <div className={"validation " + (csvValidation.valid ? "ok" : "fail")}><b>{csvValidation.message}</b>{csvValidation.details.map((line, i) => <small key={i}>{line}</small>)}</div>}</div></div><div className="notice"><LockKeyhole size={17}/><p>La validación se ejecuta localmente en el navegador. No se sube el contenido ni se modifica el archivo original.</p></div></section>}
          {section === "developer" && <section className="tool-page"><div className="eyebrow">LOW DEVELOPER / GITHUB</div><h1>Tu centro de desarrollo</h1><p className="lead">Conecta GitHub para administrar repositorios, ramas, código, pull requests, incidencias y Actions.</p><div className="integration-card"><Github size={34}/><div><b>GitHub</b><span>Integración no conectada</span><p>El conector de esta sesión puede revisar el repositorio, pero LOW necesita su propia GitHub App u OAuth y permisos limitados para operar por cuenta propia.</p></div><span className="pending">PENDIENTE</span></div><div className="module-grid compact-grid"><div className="module-card static"><Code2/><h3>Repositorios y código</h3><p>Lectura, ramas, commits y cambios propuestos.</p></div><div className="module-card static"><CheckCircle2/><h3>Pull requests</h3><p>Revisión, comparaciones y creación con aprobación.</p></div><div className="module-card static"><Zap/><h3>Actions y seguridad</h3><p>Estado de CI, Dependabot y alertas autorizadas.</p></div></div></section>}
          {section === "agents" && <section className="tool-page"><div className="eyebrow">LOW AGENTS / ORQUESTACIÓN</div><h1>Agentes y trabajos</h1><p className="lead">Un espacio para planificar tareas, delegarlas a agentes especializados y seguir trabajos persistentes.</p><div className="module-grid compact-grid">{[["RESEARCH","Investigación y síntesis",Search],["DEVELOPER","Programación y pruebas",Code2],["SHIELD","Revisión defensiva",ShieldCheck],["CREATOR","Contenido multimodal",Sparkles]].map(([name, desc, Icon]) => { const I = Icon as typeof Bot; return <div className="module-card static" key={name as string}><I/><h3>{name as string}</h3><p>{desc as string}</p><span className="pending">MOTOR PENDIENTE</span></div>; })}</div><div className="notice"><Activity size={17}/><p>La cola persistente, reintentos, cancelación y ejecución en la nube todavía no están conectados. No se simulan trabajos completados.</p></div></section>}
          {section === "creator" && <section className="tool-page"><div className="eyebrow">LOW CREATOR / MULTIMEDIA</div><h1>Centro creativo</h1><p className="lead">Un único espacio para crear texto, imágenes, audio, música, vídeo y documentos mediante proveedores compatibles.</p><div className="module-grid compact-grid">{[["Imagen",Image],["Voz",Mic2],["Audio",AudioLines],["Documentos",FileText],["Vídeo",ScanLine],["Almacenamiento",HardDrive]].map(([name, Icon]) => { const I = Icon as typeof Image; return <div className="module-card static" key={name as string}><I/><h3>{name as string}</h3><p>Proveedor por conectar.</p><span className="pending">PENDIENTE</span></div>; })}</div></section>}
          {section === "lab" && <section className="tool-page"><div className="eyebrow">LOW ACADEMY / LABORATORIO AISLADO</div><h1>Aprende en un entorno controlado</h1><p className="lead">Simulador local de autenticación para estudiar por qué concatenar entradas en SQL es inseguro y cómo los parámetros separados evitan que los datos cambien la consulta.</p><div className="lab-card"><div className="lab-top"><div><b>Laboratorio 01 · Autenticación SQL</b><small>Dataset ficticio · Sin base de datos · Sin red · Sin sistemas externos</small></div><span className="pending">SOLO SIMULACIÓN</span></div><div className="lab-modes"><button className={labMode === "vulnerable" ? "mode active" : "mode"} onClick={() => {setLabMode("vulnerable");setLabResult(null);}}>Consulta concatenada</button><button className={labMode === "parameterized" ? "mode active" : "mode"} onClick={() => {setLabMode("parameterized");setLabResult(null);}}>Consulta parametrizada</button></div><label>Usuario de demostración</label><input value={labUser} onChange={(e) => setLabUser(e.target.value)} maxLength={100}/><label>Contraseña de demostración</label><input type="password" autoComplete="off" value={labPassword} onChange={(e) => setLabPassword(e.target.value)} maxLength={100}/><div className="lab-actions"><button className="secondary" onClick={() => {setLabUser("' OR '1'='1");setLabPassword("x");setLabResult(null);}}>Cargar ejemplo educativo</button><button className="primary" onClick={() => setLabResult(simulateAuthLab(labUser, labPassword, labMode))}>Ejecutar simulación</button></div>{labResult && <div className={"lab-result " + (labResult.authenticated ? "ok" : "fail")}><b>{labResult.authenticated ? "Acceso simulado concedido" : "Acceso simulado denegado"}</b><small>{labResult.account ? "Cuenta: " + labResult.account + " · Rol: " + labResult.role : "Sin identidad autenticada"}</small><p>{labResult.explanation}</p><code>{labResult.queryPreview}</code></div>}</div>
            <div className="lab-card">
              <div className="lab-top"><div><b>Laboratorio 02 · Red Wi-Fi virtual</b><small>Topología ficticia · Eventos sintéticos · Sin acceso a redes reales</small></div><span className="pending">AISLADO</span></div>
              <p className="lead">Elige un escenario y observa paso a paso cómo LOW planifica, construye una topología ficticia, genera eventos y analiza controles defensivos.</p>
              <label htmlFor="wifi-profile">Escenario</label>
              <select id="wifi-profile" value={wifiProfile} onChange={(event) => setWifiProfile(event.target.value as WifiLabProfile)}>
                <option value="home">Red doméstica</option><option value="office">Oficina segmentada</option><option value="guest">Red de invitados</option>
              </select>
              <div className="lab-actions">
                <button className="primary" onClick={() => { const scenario = buildWifiScenario(wifiProfile); setWifiScenario(scenario); setExecutionTrace(buildWifiExecutionTrace(wifiProfile)); setExecutionIndex(0); setAutoRunLab(false); setDefenseEvents([]); setSensorEvents([]); setShowLabCode(false); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Inició simulación " + scenario.ssid]); }}>Crear y ejecutar laboratorio</button>
                <button className="secondary" onClick={() => { const events = simulateStealthDetection(); setDefenseEvents(events); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Se detectó y aisló un nodo ficticio; auditoría preservada"]); }}>Simular evasión y detección</button>
                <button className="secondary" onClick={() => { setWifiScenario(null); setExecutionTrace([]); setExecutionIndex(-1); setAutoRunLab(false); setDefenseEvents([]); setSensorEvents([]); setShowLabCode(false); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Laboratorio detenido; estado efímero limpiado, auditoría conservada"]); }}>Detener y limpiar laboratorio</button>
              </div>
              {wifiScenario && <div className="wifi-sim-results">
                <div className="validation ok"><b>{wifiScenario.ssid}</b><small>{wifiScenario.boundary}</small></div>
                <h3>Topología virtual · {wifiScenario.devices.length} nodos</h3>
                <div className="wifi-node-grid">{wifiScenario.devices.map((device) => <div className="wifi-node" key={device.id}><b>{device.name}</b><small>{device.address} · {device.role}</small><span>{device.trust === "trusted" ? "CONFIABLE" : "NO CONFIABLE"}</span></div>)}</div>
                <h3>Proceso de LOW · paso a paso</h3>
                <div className="execution-list">{executionTrace.map((step, index) => <div className={"execution-step " + (index < executionIndex ? "done" : index === executionIndex ? "current" : "")} key={step.id}><span>{index < executionIndex ? "✓" : index + 1}</span><div><b>{step.phase} · {step.action}</b><small>{step.output}</small></div><em>{index < executionIndex ? "COMPLETADO" : index === executionIndex ? "EN CURSO" : "PENDIENTE"}</em></div>)}</div>
                <button className="primary" disabled={executionIndex >= executionTrace.length - 1} onClick={() => { const next = Math.min(executionIndex + 1, executionTrace.length - 1); setExecutionIndex(next); setExecutionTrace((steps) => steps.map((step, index) => ({ ...step, status: index <= next ? "completed" : "planned" }))); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Paso " + (next + 1) + " completado"]); }}>{executionIndex >= executionTrace.length - 1 ? "Proceso completado" : "Ejecutar siguiente paso"}</button>
                <button className="secondary" disabled={executionIndex >= executionTrace.length - 1} onClick={() => setAutoRunLab((running) => !running)}>{autoRunLab ? "Pausar ejecución en directo" : "Ejecutar proceso en directo"}</button>
                <h3>Eventos sintéticos de la red</h3>
                <div className="execution-list">{wifiScenario.events.map((event) => <div className="execution-step" key={event.id}><span>•</span><div><b>{event.title}</b><small>{event.detail}</small></div><em>{event.severity.toUpperCase()}</em></div>)}</div>
              </div>}
              {defenseEvents.length > 0 && <div className="wifi-sim-results"><h3>Respuesta defensiva simulada</h3>{defenseEvents.map((event) => <div className="execution-step" key={event.id}><span>✓</span><div><b>{event.title}</b><small>{event.detail}</small></div><em>{event.severity.toUpperCase()}</em></div>)}</div>}
              <div className="wifi-sim-results">
                <h3>Observabilidad y permisos · modo académico</h3>
                <p className="lead">Prueba cómo debería comportarse LOW ante solicitudes de cámara, micrófono o movimiento. Estos botones generan eventos ficticios; no abren sensores ni solicitan permisos al sistema.</p>
                <div className="lab-actions">
                  {(["camera","microphone","motion"] as LabSensor[]).map((sensor) => <button className="secondary" key={sensor} onClick={() => { const events = simulateSensorConsent(sensor, true); setSensorEvents((current) => [...current, ...events]); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Permiso sintético aprobado: " + sensor]); }}>Simular permiso: {sensor === "camera" ? "cámara" : sensor === "microphone" ? "micrófono" : "movimiento"}</button>)}
                  <button className="secondary" onClick={() => { const events = simulateSensorConsent("camera", false); setSensorEvents((current) => [...current, ...events]); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Permiso sintético denegado"]); }}>Simular denegación</button>
                </div>
                {sensorEvents.map((event, index) => <div className="execution-step" key={event.id + index}><span>◉</span><div><b>{event.title}</b><small>{event.detail}</small></div><em>{event.severity.toUpperCase()}</em></div>)}
              </div>
              <div className="lab-actions">
                <button className="secondary" onClick={() => setShowLabCode((value) => !value)}>{showLabCode ? "Ocultar" : "Ver"} datos y estructura del escenario</button>
                <button className="secondary" onClick={() => { const events = simulateEmergencyShutdown(); setDefenseEvents((current) => [...current, ...events]); setWifiScenario(null); setExecutionTrace([]); setExecutionIndex(-1); setAutoRunLab(false); setSensorEvents([]); setAuditLog((log) => [...log, new Date().toLocaleTimeString("es-MX") + " · Parada de emergencia virtual; memoria efímera limpiada y auditoría preservada"]); }}>Parada de emergencia del nodo virtual</button>
              </div>
              {showLabCode && wifiScenario && <pre className="lab-code"><code>{JSON.stringify({ scenario: wifiScenario, execution: executionTrace, note: "Datos ficticios locales; no representan dispositivos ni tráfico real." }, null, 2)}</code></pre>}
              {executionIndex >= executionTrace.length - 1 && executionTrace.length > 0 && <div className="validation ok"><b>Simulación terminada.</b><small>Siguientes acciones: cambiar de escenario, probar permisos simulados, activar la detección defensiva o revisar los datos del laboratorio.</small></div>}
              <div className="wifi-sim-results"><h3>Registro de auditoría</h3>{auditLog.length ? auditLog.slice(-8).map((entry, index) => <small className="audit-entry" key={index}>{entry}</small>) : <small className="audit-entry">Aún no hay actividad. Los registros se conservan al detener el laboratorio.</small>}</div>
            </div>
            <div className="notice"><ShieldCheck size={17}/><p>La red Wi-Fi se representa únicamente con objetos ficticios en memoria: no crea un punto de acceso, no escanea, no captura paquetes y no se conecta a otros equipos. La evasión solo se modela como evento sintético; LOW detecta, aísla y conserva la auditoría.</p></div>
            <div className="notice"><LockKeyhole size={17}/><p>La inspección de cámara, micrófono, ubicación y archivos en dispositivos reales requerirá permisos separados, indicadores visibles y consentimiento explícito. No existe captura oculta ni borrado de registros.</p></div>
            <div className="notice"><ShieldCheck size={17}/><p>Este laboratorio solo evalúa una regla de demostración en memoria. No ejecuta consultas SQL, no contiene cuentas reales y no envía datos a la red. Úsalo para comparar el comportamiento vulnerable con el enfoque parametrizado.</p></div></section>}
          {section === "settings" && <section className="tool-page"><div className="eyebrow">LOW SHIELD / CONFIGURACIÓN</div><h1>Configuración del sistema</h1><p className="lead">Los proveedores se configuran en el servidor para mantener las credenciales fuera del cliente.</p><div className="settings-list"><div><RadioTower/><span><b>LOW Connect</b><small>Selector adaptable QR, LAN, Bluetooth o relay seguro; sincronización real pendiente de LOW Sync.</small></span><em>PREPARACIÓN</em></div><div><Cpu/><span><b>Proveedor de modelos</b><small>GLM preferido cuando endpoint y acceso estén verificados.</small></span><em>NO CONECTADO</em></div><div><Github/><span><b>GitHub App / OAuth</b><small>Permisos mínimos y confirmación para operaciones de escritura.</small></span><em>NO CONECTADO</em></div><div><ShieldCheck/><span><b>Seguridad</b><small>Sin secretos en el navegador. Acciones externas requieren aprobación.</small></span><em>BASE LOCAL</em></div><div><Globe2/><span><b>Multidispositivo</b><small>Web adaptable ahora; Android APK y funciones nativas por implementar.</small></span><em>EN PLAN</em></div></div></section>}
          <footer className="footer"><span>LOW · PERSONAL INTELLIGENCE</span><span>FOUNDATION BUILD 0.1.0</span></footer>
        </div>
      </main>
    </div>
  );
}
