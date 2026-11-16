import { useEffect, useState, type FormEvent } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Check, CheckCircle2, Code2,
  FileSearch, Fingerprint, Globe2, LockKeyhole, Menu, Network,
  RefreshCw, ScanSearch, Settings2, Shield, ShieldAlert, ShieldCheck,
  Sparkles, Terminal, X
} from "lucide-react";

type Mode = "live" | "demo" | "offline";
type Objective = "Revisión de configuración" | "Revisión de código" | "Dependencias y cadena de suministro" | "Plan de endurecimiento";
type Result = { mode: Mode; model: string; report: string; requestId?: string };

const objectives: Objective[] = [
  "Revisión de configuración",
  "Revisión de código",
  "Dependencias y cadena de suministro",
  "Plan de endurecimiento"
];

function demoReport(project: string, objective: string): string {
  return "# Revisión preliminar · " + project +
    "\n\n**Modo:** demostración local · **Objetivo:** " + objective +
    "\n\n## Resumen\nEl laboratorio funciona en modo demostración. Este resultado es una guía base, no un análisis real del activo." +
    "\n\n## Controles recomendados\n- Confirma el inventario de activos y su propietario.\n- Revisa MFA, permisos mínimos y rotación de secretos.\n- Comprueba la procedencia y el soporte de las dependencias.\n- Verifica registros, alertas, respaldos y recuperación.\n- Documenta evidencias reproducibles y correcciones." +
    "\n\n## Límites\nNo se ejecutaron escaneos, comandos, exploits ni cambios en sistemas.";
}

export default function App() {
  const [project, setProject] = useState("Mi entorno");
  const [scope, setScope] = useState("");
  const [context, setContext] = useState("");
  const [objective, setObjective] = useState<Objective>(objectives[0]);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("offline");
  const [model, setModel] = useState("Servidor no disponible");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/health").then((response) => response.json()).then((data) => {
      setMode(data.mode);
      setModel(data.model);
    }).catch(() => { setMode("offline"); setModel("Servidor no disponible"); });
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/cyber/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project, scope, context, objective,
          authorizationConfirmed: authorized
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo completar la revisión.");
      setResult(data as Result);
      setMode(data.mode);
      setModel(data.model);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  function showDemo() {
    setError("");
    setResult({ mode: "demo", model: "Plantilla local", report: demoReport(project, objective) });
    document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
  }

  const modeLabel = mode === "live" ? "MODELO CONECTADO" : mode === "demo" ? "MODO DEMOSTRACIÓN" : "SIN CONEXIÓN";

  return (
    <div className="app-shell">
      <aside className={"sidebar" + (menuOpen ? " sidebar-open" : "")}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div><strong>CYBER<span>LAB</span></strong><small>DEFENSE INTELLIGENCE</small></div>
          <button className="icon-button close-menu" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X /></button>
        </div>
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <a className="nav-item active" href="#home" onClick={() => setMenuOpen(false)}><Activity size={17} /> Panel principal</a>
        <a className="nav-item" href="#review" onClick={() => setMenuOpen(false)}><ScanSearch size={17} /> Nueva revisión</a>
        <a className="nav-item" href="#report" onClick={() => setMenuOpen(false)}><FileSearch size={17} /> Informes</a>
        <a className="nav-item" href="#scope" onClick={() => setMenuOpen(false)}><LockKeyhole size={17} /> Alcance y permisos</a>
        <div className="sidebar-bottom">
          <div className="safe-card"><Fingerprint size={19} /><strong>Primero, autorización</strong><p>Las revisiones se limitan al activo y al objetivo que declares.</p></div>
          <div className="profile-row"><div className="profile-avatar">CL</div><div><strong>Cyber Lab</strong><small>Espacio local</small></div><Settings2 size={17} className="muted-icon" /></div>
        </div>
      </aside>
      {menuOpen && <button className="scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}

      <main className="main-area" id="home">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu /></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>Panel principal</b></div>
          <div className="topbar-right"><span className={"connection-pill " + mode}><i />{modeLabel}</span></div>
        </header>

        <div className="content-wrap">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span className="pulse-dot" /> SECURITY OPERATIONS / 01</div>
              <h1>La seguridad empieza<br /><em>con claridad.</em></h1>
              <p>Un espacio de análisis defensivo para revisar código, configuraciones y dependencias dentro de un alcance autorizado.</p>
              <a href="#review" className="primary-link">Iniciar revisión <ArrowRight size={16} /></a>
            </div>
            <div className="orb-wrap" aria-hidden="true">
              <div className="orb-ring ring-one" /><div className="orb-ring ring-two" />
              <div className="orb-core"><Shield size={43} strokeWidth={1.2} /></div>
              <div className="orb-caption"><span>CORE STATUS</span><b>PROTECTED</b></div>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Estado del laboratorio">
            <div className="metric-card"><div className="metric-top"><span>Proveedor</span><Sparkles size={17} /></div><strong className="metric-value">{mode === "live" ? "Activo" : mode === "demo" ? "Demo" : "Pendiente"}</strong><small>{model}</small></div>
            <div className="metric-card"><div className="metric-top"><span>Alcance</span><Globe2 size={17} /></div><strong className="metric-value">Restringido</strong><small>Solo activos declarados</small></div>
            <div className="metric-card"><div className="metric-top"><span>Acciones activas</span><Network size={17} /></div><strong className="metric-value">0 procesos</strong><small>Sin escaneo ni explotación</small></div>
            <div className="metric-card"><div className="metric-top"><span>Protección</span><ShieldCheck size={17} /></div><strong className="metric-value">Defensiva</strong><small>Revisión y recomendaciones</small></div>
          </section>

          <section className="section-heading" id="review">
            <div><div className="eyebrow">ANÁLISIS CONTROLADO</div><h2>Nueva revisión</h2><p>Define el activo, selecciona el objetivo y confirma tu autorización.</p></div>
            <div className="section-index">01 <span>— 04</span></div>
          </section>

          <div className="work-grid">
            <form className="review-panel" onSubmit={submitReview}>
              <div className="panel-heading"><div className="panel-icon"><ScanSearch size={18} /></div><div><h3>Parámetros del análisis</h3><p>Los datos se procesan en el servidor configurado.</p></div></div>
              <label className="field-label" htmlFor="project">Nombre del proyecto</label>
              <input id="project" className="text-input" value={project} onChange={(e) => setProject(e.target.value)} maxLength={80} required placeholder="Ej. Portal interno" />
              <label className="field-label" htmlFor="scope">Activo o alcance autorizado</label>
              <input id="scope" className="text-input" value={scope} onChange={(e) => setScope(e.target.value)} minLength={8} maxLength={500} required placeholder="Ej. repositorio propio: github.com/usuario/proyecto" />
              <div className="field-hint"><LockKeyhole size={13} /> No incluyas contraseñas, tokens ni datos personales.</div>
              <label className="field-label" htmlFor="objective">Tipo de revisión</label>
              <div className="select-wrap"><select id="objective" value={objective} onChange={(e) => setObjective(e.target.value as Objective)}>{objectives.map((item) => <option key={item}>{item}</option>)}</select></div>
              <label className="field-label" htmlFor="context">Contexto adicional <span className="optional">OPCIONAL</span></label>
              <textarea id="context" className="text-input textarea" value={context} onChange={(e) => setContext(e.target.value)} maxLength={4000} placeholder="Describe el componente, tecnología, fragmento de configuración o preocupación defensiva. No pegues secretos." />
              <div className="authorization-box" id="scope">
                <label className="check-row"><input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} /><span className="custom-check"><Check size={13} /></span><span><b>Confirmo que tengo autorización</b><small>Soy propietario del activo o tengo permiso explícito para revisarlo.</small></span></label>
                <div className="authorization-note"><AlertTriangle size={14} /> Se excluyen pruebas activas, explotación, persistencia y acceso a terceros.</div>
              </div>
              {error && <div className="error-banner"><AlertTriangle size={16} />{error}</div>}
              <div className="form-actions">
                <button className="submit-button" disabled={!authorized || busy || scope.trim().length < 8 || !project.trim()} type="submit">
                  {busy ? <><RefreshCw className="spin" size={16} /> Preparando revisión...</> : <>Ejecutar revisión defensiva <ArrowRight size={16} /></>}
                </button>
                <button className="demo-button" type="button" onClick={showDemo}>Vista de demostración</button>
              </div>
            </form>

            <aside className="side-column">
              <div className="info-panel">
                <div className="panel-heading compact"><div className="panel-icon violet"><ShieldAlert size={18} /></div><div><h3>Límites de seguridad</h3><p>Guardrails del laboratorio</p></div></div>
                <ul className="guard-list">
                  <li><CheckCircle2 /> Solo revisión defensiva autorizada</li>
                  <li><CheckCircle2 /> Sin ejecución de código o comandos</li>
                  <li><CheckCircle2 /> Sin escaneo de redes ni explotación</li>
                  <li><CheckCircle2 /> Sin guardar claves en el navegador</li>
                  <li><CheckCircle2 /> Respuestas revisables por una persona</li>
                </ul>
              </div>
              <div className="provider-panel">
                <div className="provider-top"><span className="provider-symbol"><Code2 size={18} /></span><span className="provider-tag">{mode === "live" ? "CONECTADO" : "CONFIGURACIÓN"}</span></div>
                <h3>Motor de inteligencia</h3>
                <p>{mode === "live" ? "El servidor indica que hay un proveedor conectado." : "Conecta una API autorizada desde el entorno del servidor para habilitar análisis generados por IA."}</p>
                <div className="provider-model"><span>MODELO</span><b>{model}</b></div>
              </div>
              <div className="tip-panel"><Terminal size={16} /><p><b>Consejo:</b> inicia con revisión de dependencias o configuración. Son buenos puntos de partida para fortalecer un proyecto.</p></div>
            </aside>
          </div>

          <section className="report-section" id="report">
            <div className="section-heading report-heading"><div><div className="eyebrow">RESULTADO Y TRAZABILIDAD</div><h2>Informe de revisión</h2><p>Los resultados deben verificarse antes de aplicar cambios.</p></div><span className="report-count">{result ? "01 INFORME" : "SIN INFORMES"}</span></div>
            {result ? <div className="result-panel">
              <div className="result-top"><div><span className={"result-mode " + result.mode}>{result.mode === "live" ? "ANÁLISIS DE IA" : "DEMOSTRACIÓN"}</span><h3>{project}</h3><p>Motor: {result.model}{result.requestId ? " · ID: " + result.requestId : ""}</p></div><button className="copy-button" onClick={() => navigator.clipboard?.writeText(result.report)}><Code2 size={15} /> Copiar informe</button></div>
              <pre className="report-text">{result.report}</pre>
            </div> : <div className="empty-state"><div className="empty-icon"><FileSearch size={25} /></div><h3>Tu próximo informe aparecerá aquí</h3><p>Completa los parámetros y ejecuta una revisión autorizada o abre la vista de demostración.</p></div>}
          </section>

          <footer className="footer"><span>GPT-6 CYBER LAB <i>·</i> BUILD 0.1.0</span><span><i className="footer-dot" /> DEFENSIVE MODE ONLY</span></footer>
        </div>
      </main>
    </div>
  );
}