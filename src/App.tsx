import { useEffect, useMemo, useState } from 'react';
import { auth, api } from './lib/client';
import type { AuthUser } from './lib/client';
import {
  Activity,
  ArrowUp,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Globe2,
  KeyRound,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import './index.css';

type Message = { role: 'user' | 'assistant'; content: string; id: string; imageUrl?: string; mediaUrl?: string; mediaType?: 'image' | 'video' };
type VaultRecord = {
  id: string;
  title: string;
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
};
type Note = { id: string; title: string; content: string; createdAt: string };
type ApiKey = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
};
const modes = [
  ['General', 'Asistente general'],
  ['Investigación', 'Investigación y análisis'],
  ['Programación', 'Programación y depuración'],
  ['Creatividad', 'Escritura y creación'],
  ['Estudio', 'Tutor y aprendizaje'],
  ['Matemáticas', 'Matemáticas y cálculo'],
  ['Productividad', 'Planificación y trabajo'],
  ['Seguridad defensiva', 'Ciberseguridad autorizada'],
  ['Agente', 'Agente con herramientas y verificación'],
  ['Imagen', 'Imágenes con Higgsfield'],
  ['Video', 'Vídeo con Higgsfield'],
] as const;
const modules = [
  ['CORE', 'Núcleo cognitivo', 'Razonamiento y coordinación', BrainCircuit],
  ['MEMORY', 'Memoria cifrada', 'Conocimiento privado', BookOpen],
  ['RESEARCH', 'Investigación', 'Fuentes y exploración web', Search],
  ['DEVELOPER', 'Desarrollador', 'Código y depuración', Code2],
  ['CREATOR', 'Creador', 'Contenido multimodal', Sparkles],
  ['VOICE', 'Voz', 'Interacción hablada', Activity],
  ['WORK', 'Agentes de trabajo', 'Flujos y tareas', Bot],
  ['CONNECT', 'Conexiones', 'API compatible con agentes', Globe2],
  ['CLOUD', 'Nube', 'Almacenamiento privado', LockKeyhole],
  ['SHIELD', 'Ciberseguridad', 'Auditoría defensiva', ShieldCheck],
] as const;
const bytesToB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const b64ToBytes = (s: string) =>
  Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(passphrase: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
async function encryptNote(title: string, content: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12)),
    key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(
    JSON.stringify({ title, content })
  );
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );
  return {
    title: 'Cifrado AES-GCM',
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(cipher)),
  };
}
async function decryptNote(
  row: VaultRecord,
  passphrase: string
): Promise<Note> {
  const key = await deriveKey(passphrase, b64ToBytes(row.salt));
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(row.iv) },
    key,
    b64ToBytes(row.ciphertext)
  );
  const value = JSON.parse(new TextDecoder().decode(plain));
  return {
    id: row.id,
    title: value.title,
    content: value.content,
    createdAt: row.createdAt,
  };
}
function apiErrorMessage(value: unknown, fallback: string) {
  if (value && typeof value === 'object') {
    const issue = value as {
      message?: unknown;
      response?: { data?: { error?: unknown; message?: unknown } };
      data?: { error?: unknown; message?: unknown };
    };
    const serverMessage =
      issue.response?.data?.error ??
      issue.response?.data?.message ??
      issue.data?.error ??
      issue.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage.trim();
    if (typeof issue.message === 'string' && issue.message.trim() && !/request failed|xhr error|network error/i.test(issue.message)) {
      return issue.message.trim();
    }
  }
  return fallback;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null),
    [ready, setReady] = useState(false),
    [err, setErr] = useState('');
  const [page, setPage] = useState('Chat'),
    [menu, setMenu] = useState(false);
  const [mode, setMode] = useState<(typeof modes)[number][0]>('General');
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false);
  const [passphrase, setPassphrase] = useState(''),
    [unlocked, setUnlocked] = useState(false),
    [vaultRows, setVaultRows] = useState<VaultRecord[]>([]),
    [notes, setNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState(''),
    [noteContent, setNoteContent] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]),
    [newKey, setNewKey] = useState(''),
    [keyLabel, setKeyLabel] = useState('Agente externo');
  const [target, setTarget] = useState(''),
    [authorized, setAuthorized] = useState(false),
    [scanResult, setScanResult] = useState(''),
    [scanBusy, setScanBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [learningReport, setLearningReport] = useState('');
  const [learningAt, setLearningAt] = useState('');
  const [higgsfieldConfigured, setHiggsfieldConfigured] = useState(false);
  useEffect(() => {
    auth
      .getUser()
      .then(setUser)
      .catch(() => setErr('No se pudo restaurar la sesión.'))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (page === 'Higgsfield Studio') {
      api.get('/api/guest/integrations/higgsfield').then(r => setHiggsfieldConfigured(Boolean(r.data.configured))).catch(() => setHiggsfieldConfigured(false));
    }
  }, [page]);
  useEffect(() => {
    if (page === 'Aprendizaje') {
      api.get('/api/learning/latest').then(r => {
        setLearningReport(r.data.report || 'La primera autoevaluación se ejecutará en el próximo ciclo diario.');
        setLearningAt(r.data.createdAt || '');
      }).catch(() => setLearningReport('No se pudo cargar la autoevaluación.'));
    }
  }, [page]);
  useEffect(() => {
    if (user) {
      api
        .get('/api/keys')
        .then(r => setKeys(r.data.keys || []))
        .catch(() => {});
    }
  }, [user]);
  const nav = [
    ['Chat', Sparkles],
    ['Aprendizaje', BookOpen],
    ['Agentes y API', Globe2],
    ['Ciberseguridad', ShieldCheck],
    ['Módulos', BrainCircuit],
    ['Higgsfield Studio', Sparkles],
  ] as const;
  async function login() {
    setErr('');
    try {
      await auth.signInWithRedirect();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    }
  }
  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const history = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user' as const, content: q },
    ];
    setMessages(history);
    setInput('');
    setBusy(true);
    try {
      const wantsVideo = mode === 'Video' || /\b(video|vídeo|clip|animación)\b/i.test(q);
      const wantsImage = mode === 'Imagen' || /\b(genera|crea|dibuja|diseña|ilustra|hazme|renderiza)\b.*\b(imagen|foto|ilustración|dibujo|logo|portada|ilustracion)\b/i.test(q);
      if (wantsImage || wantsVideo) {
        const kind = wantsVideo ? 'video' : 'image';
        const r = await api.post('/api/guest/media', { prompt: q, kind });
        let mediaUrl = r.data.mediaUrl || r.data.imageUrl || '';
        let mediaStatus = r.data.status || 'completed';
        if (r.data.jobId && r.data.accessToken) {
          for (let attempt = 0; attempt < 45; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const poll = await api.get('/api/guest/media/' + encodeURIComponent(r.data.jobId) + '?token=' + encodeURIComponent(r.data.accessToken));
            mediaStatus = poll.data.status || 'processing';
            if (mediaStatus === 'completed') { mediaUrl = poll.data.mediaUrl || ''; break; }
            if (['failed', 'nsfw', 'canceled'].includes(mediaStatus)) throw new Error(poll.data.error || 'Higgsfield no pudo completar la generación.');
          }
        }
        if (mediaUrl) setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: kind === 'video' ? 'Vídeo creado con Higgsfield.' : 'Imagen creada con Higgsfield.', mediaUrl, mediaType: kind }]);
        else setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: 'La generación sigue en proceso. Vuelve a intentarlo en unos momentos desde Higgsfield Studio.' }]);
      } else if (mode === 'Agente' || mode === 'Investigación' || mode === 'Matemáticas') {
        const r = await api.post('/api/guest/agent', { goal: q, mode });
        const sourceText = Array.isArray(r.data.sources) && r.data.sources.length ? '\\n\\nFuentes consultadas:\\n' + r.data.sources.map((s: { title?: string; url: string }) => '- ' + (s.title || s.url) + ' — ' + s.url).join('\\n') : '';
        setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: (r.data.reply || 'Tarea completada.') + sourceText }]);
      } else {
        const r = await api.post('/api/guest/chat', {
          mode,
          message: q,
          history: history.slice(-12).map(({ role, content }) => ({ role, content })),
        });
        setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: r.data.reply }]);
      }
    } catch (e) {
      setMessages(v => [
        ...v,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: apiErrorMessage(e, 'LOW no pudo completar la solicitud. Inténtalo de nuevo.'),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  async function loadVault() {
    if (!passphrase.trim()) return;
    try {
      const r = await api.get('/api/vault');
      const rows = r.data.items as VaultRecord[];
      const decoded: Note[] = [];
      for (const row of rows) {
        try {
          decoded.push(await decryptNote(row, passphrase));
        } catch {
          throw new Error(
            'La contraseña no coincide o el registro está dañado.'
          );
        }
      }
      setVaultRows(rows);
      setNotes(decoded);
      setUnlocked(true);
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo abrir la bóveda.');
    }
  }
  async function saveNote() {
    if (!unlocked || !noteTitle.trim() || !noteContent.trim()) return;
    try {
      const encrypted = await encryptNote(
        noteTitle.trim(),
        noteContent.trim(),
        passphrase
      );
      const r = await api.post('/api/vault', encrypted);
      const row = r.data.item as VaultRecord;
      setVaultRows(v => [row, ...v]);
      setNotes(v => [
        {
          id: row.id,
          title: noteTitle,
          content: noteContent,
          createdAt: row.createdAt,
        },
        ...v,
      ]);
      setNoteTitle('');
      setNoteContent('');
      setToast('Conocimiento cifrado y guardado.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  }
  async function createKey() {
    try {
      const r = await api.post('/api/keys', { label: keyLabel });
      setNewKey(r.data.apiKey);
      setKeys(v => [r.data.key, ...v]);
      setToast('API key creada. Cópiala ahora: no volverá a mostrarse.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo crear la clave.');
    }
  }
  async function runScan() {
    if (!user) {
      setErr('Inicia sesión para utilizar Cyber Lab. El resto de LOW sigue disponible sin cuenta.');
      return;
    }
    if (!authorized || target.trim().length < 8) {
      setErr('Declara un alcance válido y confirma que tienes autorización para revisarlo.');
      return;
    }
    setScanBusy(true);
    setScanResult('');
    setErr('');
    try {
      const r = await api.post('/api/cyber/review', {
        projectName: 'LOW / Cyber Lab',
        scope: target.trim(),
        context: 'Revisión defensiva solicitada desde el módulo SHIELD integrado.',
        objective: 'Plan de endurecimiento',
        authorizationConfirmed: true,
      });
      setScanResult(r.data.report);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : 'No se pudo completar la revisión.'
      );
    } finally {
      setScanBusy(false);
    }
  }
  if (!ready)
    return (
      <div className="loading">
        <div className="orb">
          <Sparkles />
        </div>
        INICIALIZANDO LOW
      </div>
    );
  return (
    <div className="app">
      <aside className={menu ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="orb small">
            <Sparkles />
          </div>
          <span>LOW</span>
          <button className="close" onClick={() => setMenu(false)}>
            <X />
          </button>
        </div>
        <button
          className="new"
          onClick={() => {
            setPage('Chat');
            setMessages([]);
            setMenu(false);
          }}
        >
          <Plus size={16} /> Nueva conversación
        </button>
        <small className="section">ESPACIO DE TRABAJO</small>
        {nav.map(([n, I]) => (
          <button
            key={n}
            className={page === n ? 'nav active' : 'nav'}
            onClick={() => {
              setPage(n);
              setMenu(false);
              setErr('');
            }}
          >
            <I size={17} />
            {n}
          </button>
        ))}
        <small className="section">DIEZ MÓDULOS</small>
        <div className="miniModules">
          {modules.map(([id, , , I]) => (
            <span key={id} title={id}>
              <I size={15} />
            </span>
          ))}
        </div>
        <div className="account">
          <span className="avatar">{user ? (user.name || user.email || 'L')[0].toUpperCase() : 'G'}</span>
          <div>
            <b>{user ? (user.name || 'Mi LOW') : 'Modo invitado'}</b>
            <small>{user ? (user.email || 'Sesión privada') : 'Sin cuenta · sesión local'}</small>
          </div>
          {user && <button onClick={() => auth.signOut().then(() => setUser(null))}>
            <LogOut size={16} />
          </button>}
        </div>
      </aside>
      <main className="main">
        <header>
          <button className="hamb" onClick={() => setMenu(true)}>
            <Menu />
          </button>
          <span>
            LOW <i>/</i> {page}
          </span>
          <small>
            <b /> NÚCLEO DISPONIBLE
          </small>
        </header>
        {err && (
          <div className="alert">
            {err}
            <button onClick={() => setErr('')}>
              <X size={14} />
            </button>
          </div>
        )}
        {toast && (
          <div className="toast">
            {toast}
            <button onClick={() => setToast('')}>
              <X size={14} />
            </button>
          </div>
        )}
        {page === 'Chat' && (
          <section className="chat">
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="heroOrb">
                  <div />
                </div>
                <small>✦ NÚCLEO COGNITIVO EN LÍNEA</small>
                <h1>
                  ¿Qué vamos a<br />
                  <em>descubrir hoy?</em>
                </h1>
                <p>
                  Explora, investiga, programa, aprende y coordina tus agentes
                  desde un solo lugar.
                </p>
                <div className="prompts">
                  {[
                    'Investiga tecnologías de IA recientes',
                    'Ayúdame a auditar código de forma defensiva',
                    'Diseña un agente para automatizar mi trabajo',
                  ].map(x => (
                    <button key={x} onClick={() => setInput(x)}>
                      <Search size={15} />
                      {x}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="thread">
                {messages.map(m => (
                  <article key={m.id} className={'msg ' + m.role}>
                    <b>{m.role === 'assistant' ? 'LOW' : 'TÚ'}</b>
                    {m.content && <p>{m.content}</p>}
                    {m.mediaUrl && m.mediaType === 'video' && <video className="generatedImage" controls playsInline src={m.mediaUrl}>Tu navegador no puede reproducir este vídeo.</video>}
                    {(m.imageUrl || (m.mediaUrl && m.mediaType === 'image')) && <img className="generatedImage" src={m.mediaUrl || m.imageUrl} alt="Imagen generada por LOW" />}
                  </article>
                ))}
                {busy && (
                  <article className="msg assistant">
                    <b>LOW</b>
                    <p className="typing">Analizando y elaborando…</p>
                  </article>
                )}
              </div>
            )}
            <div className="composer">
              <select aria-label="Modo de LOW" value={mode} onChange={e => setMode(e.target.value as (typeof modes)[number][0])}>
                {modes.map(([name, label]) => <option key={name} value={name}>{label}</option>)}
              </select>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={mode === 'Imagen' ? 'Describe la imagen que Higgsfield debe crear…' : mode === 'Video' ? 'Describe el vídeo que Higgsfield debe generar…' : mode === 'Agente' ? 'Asigna una misión; LOW planificará y usará herramientas seguras…' : 'Escribe lo que quieres explorar, aprender o crear…'}
              />
              <button disabled={!input.trim() || busy} onClick={send}>
                <ArrowUp />
              </button>
            </div>
            <small className="hint">
              LOW CORE · {mode.toUpperCase()} · MODO INVITADO DISPONIBLE
            </small>
          </section>
        )}
        {page === 'Higgsfield Studio' && (
          <section className="content">
            <small>LOW CREATOR / HIGGSFIELD API</small>
            <h1>Studio <em>multimedia.</em></h1>
            <p>Genera imágenes con Grok Imagine 2.0 y vídeos con Seedance 2.5. Las solicitudes se procesan en los servidores de Higgsfield y LOW consulta su estado hasta recibir el resultado.</p>
            <div className="creatorCard">
              <div className="creatorStatus"><span className={higgsfieldConfigured ? 'statusDot online' : 'statusDot'} />{higgsfieldConfigured ? 'HIGGSFIELD API CONECTADA' : 'FALTA CONECTAR API KEY'}</div>
              <p>{higgsfieldConfigured ? 'La credencial está guardada en el backend. La clave nunca se envía al navegador.' : 'Conecta tu API key de Higgsfield mediante el formulario seguro de credenciales de esta conversación. Pega la clave completa exactamente como la copiaste de open.higgsfield.ai; no la envíes por el chat.'}</p>
              <a href="https://open.higgsfield.ai/api-keys" target="_blank" rel="noreferrer">Crear o consultar API key de Higgsfield ↗</a>
              <div className="studioActions">
                <button className="primary" onClick={() => { setMode('Imagen'); setPage('Chat'); }}>Crear imagen <Sparkles size={16} /></button>
                <button className="secondary" onClick={() => { setMode('Video'); setPage('Chat'); }}>Crear vídeo <Activity size={16} /></button>
              </div>
            </div>
            <div className="grid">
              <article><Sparkles /><small>IMAGEN</small><h3>Grok Imagine 2.0</h3><p>Generación y edición de imágenes, con salida 1K o 2K.</p></article>
              <article><Activity /><small>VÍDEO</small><h3>Seedance 2.5</h3><p>Vídeos de texto a vídeo, hasta 30 segundos, con resolución y audio configurables.</p></article>
            </div>
            <small className="subtle">El uso de la API de Higgsfield se factura por separado del plan web de Higgsfield. Requiere saldo prepago en su consola.</small>
          </section>
        )}
        {page === 'Aprendizaje' && (
          <section className="content">
            <small>MEMORY / ENCRYPTED KNOWLEDGE</small>
            <h1>
              Aprender para <em>evolucionar.</em>
            </h1>
            <p>
              La bóveda cifra cada nota en tu dispositivo con AES‑256‑GCM antes
              de enviarla. Tu contraseña no se transmite ni se guarda en LOW.
            </p>
            <article className="learningCard">
              <div><small>LOW SELF-REVIEW · CICLO DIARIO</small><h3>Autoevaluación del sistema</h3></div>
              {learningAt && <small>{new Date(learningAt).toLocaleString()}</small>}
              <p>{learningReport || 'Preparando el primer ciclo de evaluación.'}</p>
              <small className="subtle">LOW revisa su arquitectura y propone mejoras. No modifica su propio código, permisos ni protecciones sin pruebas y aprobación.</small>
            </article>
            {!user && <div className="alert">La conversación y los modos de LOW funcionan sin cuenta. Para guardar la bóveda sincronizada y administrar claves API, inicia sesión de forma opcional.</div>}
            <div className="noteForm">
              {!unlocked ? (
                <>
                  <label>Contraseña de la bóveda</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Crea o introduce tu contraseña privada"
                  />
                  <button
                    className="primary"
                    onClick={loadVault}
                    disabled={!passphrase.trim()}
                  >
                    Desbloquear bóveda <LockKeyhole size={16} />
                  </button>
                  <small className="subtle">
                    Importante: si olvidas esta contraseña, LOW no podrá
                    recuperar el contenido cifrado.
                  </small>
                </>
              ) : (
                <>
                  <div className="unlock">
                    <span>
                      <LockKeyhole size={15} /> BÓVEDA DESBLOQUEADA EN ESTE
                      DISPOSITIVO
                    </span>
                    <button
                      onClick={() => {
                        setUnlocked(false);
                        setPassphrase('');
                        setNotes([]);
                      }}
                    >
                      Bloquear
                    </button>
                  </div>
                  <input
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="Título del conocimiento"
                  />
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Hallazgos, ideas, apuntes y aprendizajes…"
                  />
                  <button
                    className="primary"
                    onClick={saveNote}
                    disabled={!noteTitle.trim() || !noteContent.trim()}
                  >
                    Cifrar y guardar <Plus size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="notes">
              {notes.map(n => (
                <article key={n.id}>
                  <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                  <h3>{n.title}</h3>
                  <p>{n.content}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === 'Agentes y API' && !user && (
          <section className="content"><small>CONNECT / CUENTA OPCIONAL</small><h1>Conexiones <em>privadas.</em></h1><p>El chat y los modos principales no requieren cuenta. La emisión y administración de claves API queda protegida detrás de una sesión para evitar que terceros creen credenciales en tu nombre.</p><button className="primary" onClick={login}>Iniciar sesión opcional <ArrowUp size={16} /></button></section>
        )}
        {page === 'Agentes y API' && user && (
          <section className="content">
            <small>CONNECT / OPEN AGENT INTERFACE</small>
            <h1>
              LOW se conecta
              <br />
              <em>con otros agentes.</em>
            </h1>
            <p>
              API compatible con el formato OpenAI Chat Completions. Configúrala
              en clientes y agentes que acepten un endpoint personalizado,
              incluidos conectores compatibles con Grok/xAI y otros proveedores.
            </p>
            <div className="endpoint">
              <label>BASE URL</label>
              <code>{window.location.origin}/v1</code>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(window.location.origin + '/v1')
                }
              >
                <Copy size={15} />
              </button>
              <label>CHAT COMPLETIONS</label>
              <code>POST /v1/chat/completions</code>
            </div>
            <div className="noteForm">
              <h3>
                <KeyRound size={17} /> Crear clave de API
              </h3>
              <input
                value={keyLabel}
                onChange={e => setKeyLabel(e.target.value)}
                placeholder="Nombre del agente"
              />
              <button className="primary" onClick={createKey}>
                Generar API key <Plus size={16} />
              </button>
              {newKey && (
                <div className="keyReveal">
                  <small>
                    COPIA ESTA CLAVE AHORA · SOLO SE MUESTRA UNA VEZ
                  </small>
                  <code>{newKey}</code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(newKey)}
                  >
                    <Copy size={14} /> Copiar
                  </button>
                </div>
              )}
            </div>
            <h3 className="listTitle">Claves registradas</h3>
            {keys.map(k => (
              <div className="keyRow" key={k.id}>
                <KeyRound size={16} />
                <span>{k.label}</span>
                <small>{new Date(k.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
            <p className="subtle">
              La clave completa solo se muestra al crearla. LOW almacena su hash
              SHA‑256, nunca el secreto en claro. Cada agente necesita su propia
              clave revocable.
            </p>
          </section>
        )}
        {page === 'Ciberseguridad' && (
          <section className="content">
            <small>SHIELD / CYBER LAB INTEGRADO</small>
            <h1>
              Análisis defensivo
              <br />
              <em>en un solo núcleo.</em>
            </h1>
            <p>
              Cyber Lab ahora forma parte de LOW. Analiza el alcance y el contexto que declares, recibe recomendaciones priorizadas y distingue evidencias de hipótesis. No ejecuta escaneos de red, explotación ni acciones sobre el objetivo.
            </p>
            {!user && <div className="alert">Para enviar una revisión necesitas iniciar sesión. El chat y las demás funciones públicas de LOW no se bloquean. <button className="primary" onClick={login}>Iniciar sesión</button></div>}
            <div className="securityCard">
              <div className="secIcon">
                <ShieldCheck />
              </div>
              <h3>Proyecto, activo o alcance autorizado</h3>
              <input
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="Repositorio propio, aplicación o activo autorizado"
                maxLength={500}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={e => setAuthorized(e.target.checked)}
                />{' '}
                    'Confirmo que soy propietario del sitio o tengo autorización para
                revisarlo.'
              </label>
              <button
                className="primary"
                onClick={runScan}
                disabled={scanBusy || !user || !authorized || target.trim().length < 8}
              >
                {scanBusy ? 'Revisando…' : 'Iniciar revisión segura'}{' '}
                <ScanSearch size={16} />
              </button>
              <small className="subtle">Cyber Lab analiza únicamente la información declarada en esta solicitud. No se conecta al objetivo ni verifica por sí mismo su propiedad. El informe no sustituye una auditoría profesional.</small>
            </div>
            {scanResult && (
              <article className="report">
                <h3>Informe de seguridad</h3>
                <p>{scanResult}</p>
              </article>
            )}
            <div className="grid">
              <article>
                <ShieldCheck />
                <h3>Autoprotección</h3>
                <p>
                  Validación de entradas, autenticación, control de permisos y
                  revisión de cambios.
                </p>
              </article>
              <article>
                <Activity />
                <h3>Mejora continua</h3>
                <p>
                  Registro de hallazgos y recomendaciones para corregir
                  debilidades verificadas.
                </p>
              </article>
            </div>
          </section>
        )}
        {page === 'Módulos' && (
          <section className="content">
            <small>LOW ARCHITECTURE</small>
            <h1>
              Diez módulos.
              <br />
              <em>Un ecosistema.</em>
            </h1>
            <p>
              Arquitectura preparada para crecer con proveedores, herramientas y
              agentes adicionales.
            </p>
            <div className="grid">
              {modules.map(([id, name, desc, I], i) => (
                <article key={id}>
                  <I />
                  <small>{id}</small>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                  <label>
                    {i < 3 ? 'BASE IMPLEMENTADA' : 'MÓDULO EN EXPANSIÓN'}
                  </label>
                </article>
              ))}
            </div>
          </section>
        )}
        <footer className="foot">
          LOW INTELLIGENCE SYSTEMS <span>BUILD 03.1 · IMAGE + AGENT CORE</span>
        </footer>
      </main>
    </div>
  );
}
