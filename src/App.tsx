import { useEffect, useMemo, useState, type FormEvent } from "react";
import { validateCsv, validateJson } from "./lib/validators";
import {
  Activity, ArrowUpRight, AudioLines, Bot, CheckCircle2, ChevronRight,
  Code2, Cpu, Database, FileCheck2, FileJson, FileText, Globe2,
  Github, HardDrive, Image, Layers3, LockKeyhole, Menu, Mic2, Network,
  RadioTower, RefreshCw, ScanLine, Search, Send, Settings2, ShieldCheck,
  Sparkles, Wifi, X, Zap
} from "lucide-react";

type Section = "overview" | "assistant" | "network" | "data" | "developer" | "agents" | "creator" | "settings";
type NetworkResult = { online: boolean; latencyMs: number | null; checkedAt: string; api: string };
type ValidationResult = { valid: boolean; message: string; details: string[] };

const modules = [
  { id: "assistant", title: "LOW CORE", desc: "Asistente central y contexto de trabajo", icon: Bot, status: "INTERFAZ LISTA" },
  { id: "agents", title: "AGENTS", desc: "Agentes, tareas y ejecución coordinada", icon: Layers3, status: "POR CONECTAR" },
  { id: "developer", title: "DEVELOPER", desc: "GitHub, repositorios, PR y Actions", icon: Github, status: "POR CONECTAR" },
  { id: "network", title: "NETWORK", desc: "Conectividad y diagnóstico de red", icon: Network, status: "DIAGNÓSTICO LOCAL" },
  { id: "data", title: "DATA", desc: "Validación y calidad de datos", icon: Database, status: "HERRAMIENTA LOCAL" },
  { id: "creator", title: "CREATOR", desc: "Imagen, audio, vídeo y documentos", icon: Image, status: "POR CONECTAR" }
] as const;

export default function App() {
  const [section, setSection] = useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [networkResult, setNetworkResult] = useState<NetworkResult | null>(null);
  const [networkBusy, setNetworkBusy] = useState(false);
  const [jsonText, setJsonText] = useState('{\n  "name": "LOW",\n  "version": "0.1.0",\n  "active": true\n}');
  const [requiredFields, setRequiredFields] = useState("name, version");
  const [csvText, setCsvText] = useState("id,name,status\n1,LOW,active\n2,Agent,planned");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [csvValidation, setCsvValidation] = useState<ValidationResult | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>(["Hola. Soy LOW. Mi interfaz principal está lista; conecta un proveedor de modelos desde la configuración del servidor para habilitar respuestas inteligentes."]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  async function runNetworkCheck() {
    setNetworkBusy(true);
    const started = performance.now();
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
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
    overview: "Centro de mando", assistant: "LOW CORE", network: "Diagnóstico de red",
    data: "Validación de datos", developer: "GitHub Developer", agents: "Agentes y trabajos",
    creator: "Centro creativo", settings: "Configuración"
  } as Record<Section, string>)[section], [section]);

  const nav = [
    ["overview", "Centro de mando", Activity], ["assistant", "LOW CORE", Bot],
    ["agents", "Agentes", Layers3], ["developer", "GitHub", Github],
    ["network", "Redes", Network], ["data", "Datos", Database],
    ["creator", "Creator", Sparkles], ["settings", "Configuración", Settings2]
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
            <div className="section-title"><div><div className="eyebrow">ARQUITECTURA MODULAR</div><h2>Herramientas de LOW</h2><p>Abre un módulo para usar sus herramientas o revisar su estado.</p></div><span>06 MÓDULOS</span></div>
            <div className="module-grid">{modules.map((module) => { const Icon = module.icon; return <button className="module-card" key={module.id} onClick={() => go(module.id as Section)}><div className="module-icon"><Icon size={19}/></div><div className="module-status">{module.status}</div><h3>{module.title}</h3><p>{module.desc}</p><span className="module-open">Abrir módulo <ArrowUpRight size={14}/></span></button>; })}</div>
            <div className="notice"><LockKeyhole size={17}/><p><b>Estado transparente:</b> el panel y las herramientas locales funcionan. GitHub, modelos, voz, agentes y creación multimedia aparecen como pendientes hasta conectar y probar cada servicio.</p></div>
          </>}
          {section === "assistant" && <section className="tool-page"><div className="eyebrow">LOW CORE / CONVERSACIÓN</div><h1>Habla con LOW</h1><p className="lead">Interfaz de conversación lista. El proveedor de IA se conecta desde el backend; no guardamos claves en el navegador.</p><div className="chat-box"><div className="chat-head"><div className="module-icon"><Bot/></div><div><b>LOW CORE</b><small>Proveedor: sin conectar</small></div><span className="pending">NECESITA CONEXIÓN</span></div><div className="chat-messages">{messages.map((item, i) => <div className={item.startsWith("Tú:") ? "bubble user" : "bubble"} key={i}>{item}</div>)}</div><form className="chat-input" onSubmit={sendMessage}><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe una instrucción para LOW..." maxLength={4000}/><button className="primary" type="submit" aria-label="Enviar"><Send size={17}/></button></form></div><div className="notice"><Cpu size={17}/><p>La conversación funciona como interfaz local; las respuestas inteligentes requieren configurar un adaptador de modelo y su credencial en el servidor.</p></div></section>}
          {section === "network" && <section className="tool-page"><div className="eyebrow">LOW NETWORK / CONECTIVIDAD</div><h1>Diagnóstico de red</h1><p className="lead">Comprueba la conexión del dispositivo y la disponibilidad de la API de LOW. No se escanean redes ni dispositivos ajenos.</p><div className="network-card"><div className="network-visual"><Wifi size={34}/><span>{online ? "CONECTADO" : "DESCONECTADO"}</span></div><div className="network-details"><div><span>Dispositivo</span><b>{online ? "Navegador en línea" : "Navegador sin conexión"}</b></div><div><span>API LOW</span><b>{networkResult?.api || "Sin comprobar"}</b></div><div><span>Latencia API</span><b>{networkResult?.latencyMs == null ? "—" : networkResult.latencyMs + " ms"}</b></div><div><span>Última comprobación</span><b>{networkResult?.checkedAt || "—"}</b></div></div><button className="primary" onClick={runNetworkCheck} disabled={networkBusy}>{networkBusy ? <RefreshCw className="spin"/> : <RadioTower/>}{networkBusy ? "Comprobando..." : "Comprobar conexión"}</button></div><div className="notice"><ShieldCheck size={17}/><p>Esta prueba mide la disponibilidad del propio servicio LOW. Las pruebas avanzadas de LAN o redes propias se habilitarán con permisos explícitos, límites y registro de actividad.</p></div></section>}
          {section === "data" && <section className="tool-page"><div className="eyebrow">LOW DATA / CALIDAD DE INFORMACIÓN</div><h1>Valida tus datos</h1><p className="lead">Comprueba estructura JSON y consistencia básica de CSV directamente en tu dispositivo.</p><div className="validator-grid"><form className="validator-card" onSubmit={handleValidate}><div className="card-head"><FileJson/><div><b>Validador JSON</b><small>Sintaxis y campos requeridos</small></div></div><label>JSON a validar</label><textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false}/><label>Campos obligatorios (separados por coma)</label><input value={requiredFields} onChange={(e) => setRequiredFields(e.target.value)}/><button className="primary" type="submit"><FileCheck2 size={16}/> Validar JSON</button>{validation && <div className={"validation " + (validation.valid ? "ok" : "fail")}><b>{validation.message}</b>{validation.details.map((line, i) => <small key={i}>{line}</small>)}</div>}</form><div className="validator-card"><div className="card-head"><FileText/><div><b>Validador CSV</b><small>Encabezados y número de columnas</small></div></div><label>Contenido CSV</label><textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} spellCheck={false}/><button className="primary" onClick={() => setCsvValidation(validateCsv(csvText))}><FileCheck2 size={16}/> Validar CSV</button>{csvValidation && <div className={"validation " + (csvValidation.valid ? "ok" : "fail")}><b>{csvValidation.message}</b>{csvValidation.details.map((line, i) => <small key={i}>{line}</small>)}</div>}</div></div><div className="notice"><LockKeyhole size={17}/><p>La validación se ejecuta localmente en el navegador. No se sube el contenido ni se modifica el archivo original.</p></div></section>}
          {section === "developer" && <section className="tool-page"><div className="eyebrow">LOW DEVELOPER / GITHUB</div><h1>Tu centro de desarrollo</h1><p className="lead">Conecta GitHub para administrar repositorios, ramas, código, pull requests, incidencias y Actions.</p><div className="integration-card"><Github size={34}/><div><b>GitHub</b><span>Integración no conectada</span><p>El conector de esta sesión puede revisar el repositorio, pero LOW necesita su propia GitHub App u OAuth y permisos limitados para operar por cuenta propia.</p></div><span className="pending">PENDIENTE</span></div><div className="module-grid compact-grid"><div className="module-card static"><Code2/><h3>Repositorios y código</h3><p>Lectura, ramas, commits y cambios propuestos.</p></div><div className="module-card static"><CheckCircle2/><h3>Pull requests</h3><p>Revisión, comparaciones y creación con aprobación.</p></div><div className="module-card static"><Zap/><h3>Actions y seguridad</h3><p>Estado de CI, Dependabot y alertas autorizadas.</p></div></div></section>}
          {section === "agents" && <section className="tool-page"><div className="eyebrow">LOW AGENTS / ORQUESTACIÓN</div><h1>Agentes y trabajos</h1><p className="lead">Un espacio para planificar tareas, delegarlas a agentes especializados y seguir trabajos persistentes.</p><div className="module-grid compact-grid">{[["RESEARCH","Investigación y síntesis",Search],["DEVELOPER","Programación y pruebas",Code2],["SHIELD","Revisión defensiva",ShieldCheck],["CREATOR","Contenido multimodal",Sparkles]].map(([name, desc, Icon]) => { const I = Icon as typeof Bot; return <div className="module-card static" key={name as string}><I/><h3>{name as string}</h3><p>{desc as string}</p><span className="pending">MOTOR PENDIENTE</span></div>; })}</div><div className="notice"><Activity size={17}/><p>La cola persistente, reintentos, cancelación y ejecución en la nube todavía no están conectados. No se simulan trabajos completados.</p></div></section>}
          {section === "creator" && <section className="tool-page"><div className="eyebrow">LOW CREATOR / MULTIMEDIA</div><h1>Centro creativo</h1><p className="lead">Un único espacio para crear texto, imágenes, audio, música, vídeo y documentos mediante proveedores compatibles.</p><div className="module-grid compact-grid">{[["Imagen",Image],["Voz",Mic2],["Audio",AudioLines],["Documentos",FileText],["Vídeo",ScanLine],["Almacenamiento",HardDrive]].map(([name, Icon]) => { const I = Icon as typeof Image; return <div className="module-card static" key={name as string}><I/><h3>{name as string}</h3><p>Proveedor por conectar.</p><span className="pending">PENDIENTE</span></div>; })}</div></section>}
          {section === "settings" && <section className="tool-page"><div className="eyebrow">LOW SHIELD / CONFIGURACIÓN</div><h1>Configuración del sistema</h1><p className="lead">Los proveedores se configuran en el servidor para mantener las credenciales fuera del cliente.</p><div className="settings-list"><div><Cpu/><span><b>Proveedor de modelos</b><small>GLM preferido cuando endpoint y acceso estén verificados.</small></span><em>NO CONECTADO</em></div><div><Github/><span><b>GitHub App / OAuth</b><small>Permisos mínimos y confirmación para operaciones de escritura.</small></span><em>NO CONECTADO</em></div><div><ShieldCheck/><span><b>Seguridad</b><small>Sin secretos en el navegador. Acciones externas requieren aprobación.</small></span><em>BASE LOCAL</em></div><div><Globe2/><span><b>Multidispositivo</b><small>Web adaptable ahora; Android APK y funciones nativas por implementar.</small></span><em>EN PLAN</em></div></div></section>}
          <footer className="footer"><span>LOW · PERSONAL INTELLIGENCE</span><span>FOUNDATION BUILD 0.1.0</span></footer>
        </div>
      </main>
    </div>
  );
}
