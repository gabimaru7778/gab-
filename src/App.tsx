import { useEffect, useMemo, useRef, useState } from 'react';
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
  Mic,
  Volume2,
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
  ['Imagen', 'Imágenes con ComfyUI'],
  ['Video', 'Vídeo con ComfyUI'],
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
    { name: 'PBKDF2', salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer, iterations: 310000, hash: 'SHA-256' },
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
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [learningReport, setLearningReport] = useState('');
  const [learningAt, setLearningAt] = useState('');
  const [comfyConfigured, setComfyConfigured] = useState(false);
  const [sandboxCode, setSandboxCode] = useState("console.log('Hola desde LOW');\nconst total = [2, 4, 6].reduce((a, b) => a + b, 0);\nconsole.log('Total:', total);");
  const [sandboxOutput, setSandboxOutput] = useState('La salida aparecerá aquí.');
  const [sandboxRun, setSandboxRun] = useState(0);
  const developerFrameRef = useRef<HTMLIFrameElement | null>(null);
  const sandboxTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    auth
      .getUser()
      .then(setUser)
      .catch(() => setErr('No se pudo restaurar la sesión.'))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    const onSandboxMessage = (event: MessageEvent) => {
      if (event.source !== developerFrameRef.current?.contentWindow || !event.data || event.data.__lowSandbox !== true) return;
      const text = String(event.data.text || '');
      if (event.data.type === 'done' || event.data.type === 'error') { window.clearTimeout(sandboxTimerRef.current); sandboxTimerRef.current = undefined; }
      if (event.data.type === 'log') setSandboxOutput(current => current === 'Ejecutando…' ? text : current + '\\n' + text);
      if (event.data.type === 'error') setSandboxOutput(current => (current === 'Ejecutando…' ? '' : current + '\\n') + 'ERROR: ' + text);
      if (event.data.type === 'done') setSandboxOutput(current => current === 'Ejecutando…' ? 'Ejecución terminada sin salida.' : current + '\\nEjecución terminada.');
    };
    window.addEventListener('message', onSandboxMessage);
    return () => window.removeEventListener('message', onSandboxMessage);
  }, []);
  useEffect(() => {
    if (!sandboxRun) return;
    const frame = developerFrameRef.current;
    if (!frame) return;
    window.clearTimeout(sandboxTimerRef.current);
    setSandboxOutput('Ejecutando…');
    const source = JSON.stringify(sandboxCode).replace(/</g, '\\u003c');
    frame.srcdoc = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none'"></head><body><script>
      const send=(type,text='')=>parent.postMessage({__lowSandbox:true,type,text},'*');
      const fmt=value=>{try{return typeof value==='string'?value:JSON.stringify(value)??String(value)}catch{return String(value)}};
      const localConsole={log:(...v)=>send('log',v.map(fmt).join(' ')),info:(...v)=>send('log',v.map(fmt).join(' ')),warn:(...v)=>send('log','WARN: '+v.map(fmt).join(' ')),error:(...v)=>send('error',v.map(fmt).join(' '))};
      window.onerror=(message,source,line,column,error)=>send('error',error?.stack||String(message)+' ('+line+':'+column+')');
      try { new Function('console', ${source})(localConsole); send('done'); } catch(error) { send('error',error?.stack||String(error)); }
    <\/script></body></html>`;
    sandboxTimerRef.current = window.setTimeout(() => {
      setSandboxOutput(current => current + '\\nTiempo límite de 2 segundos alcanzado. El entorno se reinició.');
      frame.srcdoc = 'about:blank';
    }, 2000);
    return () => window.clearTimeout(sandboxTimerRef.current);
  }, [sandboxRun]);
  useEffect(() => {
    if (page === 'ComfyUI Studio') {
      api.get('/api/guest/integrations/creator').then(r => setComfyConfigured(Boolean(r.data.configured))).catch(() => setComfyConfigured(false));
    }
  }, [page]);
  useEffect(() => {
    if (page === 'Aprendizaje') {
      api.get('/api/learning/latest').then(r => {
        setLearningReport(r.data.report || 'El scheduler todavía no está configurado; no hay ciclos automáticos activos.');
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
    ['Laboratorio', Code2],
    ['ComfyUI Studio', Sparkles],
    ['Open Generative AI', Sparkles],
    ['ECC Engineering', Bot],
    ['Wi-Fi Security', ShieldCheck],
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
        if (!user) throw new Error('Inicia sesión para usar CREATOR. La generación se procesa en tu servidor ComfyUI configurado.');
        const r = await api.post('/api/guest/media', { prompt: q, kind });
        let mediaUrl = r.data.mediaUrl || r.data.imageUrl || '';
        let mediaStatus = r.data.status || 'completed';
        if (r.data.jobId && r.data.accessToken) {
          for (let attempt = 0; attempt < 90; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const pollResponse = await fetch('/api/guest/media/' + encodeURIComponent(r.data.jobId), { credentials: 'include', headers: { 'x-low-job-token': r.data.accessToken } });
            const pollData = await pollResponse.json().catch(() => ({}));
            if (!pollResponse.ok) throw new Error(pollData.error || 'No se pudo consultar el trabajo multimedia.');
            const poll = { data: pollData };
            mediaStatus = poll.data.status || 'processing';
            if (mediaStatus === 'completed') { mediaUrl = poll.data.mediaUrl || ''; break; }
            if (['failed', 'nsfw', 'canceled'].includes(mediaStatus)) throw new Error(poll.data.error || 'ComfyUI no pudo completar la generación.');
          }
        }
        if (mediaUrl) setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: kind === 'video' ? 'Vídeo creado con ComfyUI.' : 'Imagen creada con ComfyUI.', mediaUrl, mediaType: kind }]);
        else setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: 'La generación sigue en proceso. Vuelve a intentarlo en unos momentos desde ComfyUI Studio.' }]);
      } else if (mode === 'Investigación') {
        const r = await api.post('/api/guest/research', { query: q });
        const sourceText = Array.isArray(r.data.sources) && r.data.sources.length
          ? '\n\nFuentes consultadas:\n' + r.data.sources.map((s: { title?: string; url: string; snippet?: string }) => '- ' + (s.title || s.url) + ' — ' + s.url + (s.snippet ? '\n  ' + s.snippet : '')).join('\n')
          : '';
        setMessages(v => [...v, { id: crypto.randomUUID(), role: 'assistant', content: (r.data.answer || 'Resultados de búsqueda:') + sourceText }]);
      } else if (mode === 'Agente' || mode === 'Matemáticas') {
        const r = await api.post('/api/guest/agent', { goal: q, mode });
        const sourceText = Array.isArray(r.data.sources) && r.data.sources.length ? '\n\nFuentes consultadas:\n' + r.data.sources.map((s: { title?: string; url: string }) => '- ' + (s.title || s.url) + ' — ' + s.url).join('\n') : '';
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
      const rows = r.data.records as VaultRecord[];
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
      const row = r.data.record as VaultRecord;
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
  function startVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErr('Este navegador no ofrece dictado por voz. Puedes seguir escribiendo normalmente.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results || []).map((item: any) => item[0]?.transcript || '').join(' ').trim();
        if (transcript) setInput(current => current ? current + ' ' + transcript : transcript);
      };
      recognition.onerror = () => setErr('No se pudo reconocer el audio. Revisa el permiso del micrófono e inténtalo de nuevo.');
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setErr('No se pudo iniciar el micrófono.');
    }
  }
  function stopVoiceInput() {
    recognitionRef.current?.stop?.();
    setListening(false);
  }
  function speakText(value: string) {
    if (!('speechSynthesis' in window)) {
      setErr('La lectura en voz alta no está disponible en este navegador.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = 'es-MX';
    window.speechSynthesis.speak(utterance);
  }
  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);
  async function revokeKey(id: string) {
    try {
      await api.delete('/api/keys/' + encodeURIComponent(id));
      setKeys(current => current.filter(key => key.id !== id));
      setToast('Clave revocada. Los clientes que la usaban ya no podrán autenticarse.');
      if (newKey) setNewKey('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo revocar la clave.');
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
                    {m.role === 'assistant' && m.content && <button className="voiceRead" type="button" aria-label="Leer respuesta en voz alta" onClick={() => speakText(m.content)}><Volume2 size={15} /> Escuchar</button>}
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
                placeholder={mode === 'Imagen' ? 'Describe la imagen que ComfyUI debe crear…' : mode === 'Video' ? 'Describe el vídeo que ComfyUI debe generar…' : mode === 'Agente' ? 'Asigna una misión; LOW planificará y usará herramientas seguras…' : 'Escribe lo que quieres explorar, aprender o crear…'}
              />
              <button className="voiceInput" type="button" aria-label={listening ? 'Detener dictado' : 'Dictar mensaje'} title={listening ? 'Detener dictado' : 'Dictar mensaje'} onClick={listening ? stopVoiceInput : startVoiceInput}><Mic size={17} />{listening ? 'Detener' : 'Voz'}</button>
              <button disabled={!input.trim() || busy} onClick={send}>
                <ArrowUp />
              </button>
            </div>
            <small className="hint">
              LOW CORE · {mode.toUpperCase()} · MODO INVITADO DISPONIBLE
            </small>
          </section>
        )}
        {page === 'Laboratorio' && (
          <section className="content">
            <small>DEVELOPER / SANDBOX LOCAL</small>
            <h1>Prueba código. <em>Sin tocar el servidor.</em></h1>
            <p>Ejecutor JavaScript dentro de un iframe aislado del origen principal. No tiene Node.js, acceso a archivos ni conexión de red; se reinicia después de cada ejecución.</p>
            <div className="noteForm">
              <label>Código JavaScript</label>
              <textarea className="sandboxEditor" value={sandboxCode} onChange={event => setSandboxCode(event.target.value)} spellCheck={false} rows={10} />
              <button className="primary" onClick={() => setSandboxRun(value => value + 1)}>Ejecutar en sandbox <Code2 size={16} /></button>
              <label>Salida</label>
              <pre className="sandboxOutput">{sandboxOutput}</pre>
              <iframe ref={developerFrameRef} title="LOW JavaScript sandbox" sandbox="allow-scripts" className="sandboxFrame" />
            </div>
            <small className="subtle">Límite: es un laboratorio educativo de JavaScript en el navegador, no un contenedor Linux ni un entorno para ejecutar Python, instalar paquetes o acceder a repositorios.</small>
          </section>
        )}
        {page === 'ComfyUI Studio' && (
          <section className="content">
            <small>LOW CREATOR / COMFYUI</small>
            <h1>Studio <em>multimedia.</em></h1>
            <p>Genera imágenes y vídeos con workflows locales de ComfyUI. LOW envía el trabajo a tu servidor y consulta el estado hasta recibir el resultado.</p>
            <div className="creatorCard">
              <div className="creatorStatus"><span className={comfyConfigured ? 'statusDot online' : 'statusDot'} />{comfyConfigured ? 'COMFYUI CONFIGURADO' : 'FALTA CONFIGURAR COMFYUI'}</div>
              <p>{comfyConfigured ? 'El endpoint y los workflows están configurados en el backend. LOW no expone credenciales al navegador.' : 'Configura LOW_COMFYUI_URL y los workflows API de imagen y vídeo como variables del servidor. El workflow debe contener el marcador {{PROMPT}}.'}</p>
              <a href="https://docs.comfy.org/development/core-concepts/workflow" target="_blank" rel="noreferrer">Documentación de ComfyUI ↗</a>
              <div className="studioActions">
                <button className="primary" onClick={() => { setMode('Imagen'); setPage('Chat'); }}>Crear imagen <Sparkles size={16} /></button>
                <button className="secondary" onClick={() => { setMode('Video'); setPage('Chat'); }}>Crear vídeo <Activity size={16} /></button>
              </div>
            </div>
            <div className="grid">
              <article><Sparkles /><small>IMAGEN</small><h3>Workflow de imagen</h3><p>Generación de imágenes con el modelo que cargues en tu workflow.</p></article>
              <article><Activity /><small>VÍDEO</small><h3>Workflow de vídeo</h3><p>Generación de vídeo con Wan 2.2 u otro modelo compatible que cargues en ComfyUI.</p></article>
            </div>
            <small className="subtle">ComfyUI es software abierto y puede ejecutarse sin tarifa por solicitud. El servidor GPU, la electricidad, el almacenamiento y los modelos pueden tener costes o licencias propias.</small>
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
              de enviarla. Los registros se guardan cifrados por cuenta; todavía no hay sincronización entre dispositivos ni recuperación de clave. Tu contraseña no se transmite ni se guarda en LOW.
            </p>
            <article className="learningCard">
              <div><small>LEARNING / ESTADO DEL MÓDULO</small><h3>Autoevaluación del sistema</h3></div>
              {learningAt && <small>{new Date(learningAt).toLocaleString()}</small>}
              <p>{learningReport || 'Preparando el primer ciclo de evaluación.'}</p>
              <small className="subtle">El ciclo automático aún no está conectado. Esta sección mostrará informes cuando se configure un scheduler real.</small>
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
              API compatible con OpenAI Chat Completions para clientes servidor-a-servidor. Configúrala
              en clientes y agentes que acepten un endpoint personalizado,
              incluidos agentes que permitan endpoint personalizado y autenticación Bearer. No expongas esta clave en código de navegador.
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
                <button type="button" className="keyRevoke" onClick={() => revokeKey(k.id)} aria-label={'Revocar clave ' + k.label}>Revocar</button>
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
                    {({CORE:'CHAT BASE · PROVEEDOR REQUERIDO',MEMORY:'BÓVEDA CIFRADA · SQLITE POR CUENTA',RESEARCH:'PENDIENTE · BÚSQUEDA REAL',DEVELOPER:'SANDBOX JS · NAVEGADOR AISLADO',CREATOR:'PENDIENTE · PROVEEDOR MULTIMEDIA',VOICE:'PARCIAL · NAVEGADOR',WORK:'PARCIAL · AGENTE DE TEXTO',CONNECT:'PARCIAL · API BEARER',CLOUD:'PARCIAL · SQLITE POR CUENTA',SHIELD:'PARCIAL · ANÁLISIS DE TEXTO'})[id] || 'ESTADO NO DEFINIDO'}
                  </label>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === 'ComfyUI Studio' && (
          <section className="content">
            <small>CREATOR / COMFYUI</small>
            <h1>Imagina. <em>LOW lo crea.</em></h1>
            <p>Generación de imágenes y vídeo desde el chat, con trabajos asíncronos y consulta de estado en el servidor.</p>
            <article className="learningCard">
              <h3>{comfyConfigured ? 'Proveedor conectado' : 'Falta conectar el proveedor'}</h3>
              <p>{comfyConfigured ? 'LOW detecta la dirección del servidor y los workflows. La disponibilidad real se confirma al enviar una generación.' : 'Configura LOW_COMFYUI_URL, LOW_COMFYUI_IMAGE_WORKFLOW y LOW_COMFYUI_VIDEO_WORKFLOW en el entorno del backend. No expongas el servidor ComfyUI directamente a Internet sin autenticación y HTTPS.'}</p>
              <small className="subtle">ComfyUI no cobra por llamada en su instalación propia. Necesitas un servidor compatible con GPU, workflows API y modelos descargados; los requisitos dependen del modelo.</small>
            </article>
            <div className="grid">
              <article><Sparkles /><h3>Crear imagen</h3><p>Workflow propio · texto a imagen</p><button className="primary" onClick={() => { setMode('Imagen'); setPage('Chat'); }}>Abrir creador de imágenes <ArrowUp size={15} /></button></article>
              <article><Activity /><h3>Crear vídeo</h3><p>Workflow propio · texto a vídeo</p><button className="primary" onClick={() => { setMode('Video'); setPage('Chat'); }}>Abrir creador de vídeo <ArrowUp size={15} /></button></article>
            </div>
            <p className="subtle">No se ejecuta ninguna generación al abrir esta pantalla. Solo se cobra al enviar una solicitud al proveedor. Los resultados se consultan con un token temporal y expiran a las 24 horas en LOW.</p>
          </section>
        )}
        {page === 'Open Generative AI' && (
          <section className="content">
            <small>CREATOR / OPEN-SOURCE COMPANION</small>
            <h1>Open Generative <em>AI.</em></h1>
            <p>Conecta con el proyecto abierto Open Generative AI de GitHub: una suite independiente para crear y editar imágenes, vídeo, lip-sync y flujos creativos. LOW lo incorpora como acceso complementario; no copia ni ejecuta su aplicación dentro de este servidor.</p>
            <div className="grid">
              <article>
                <Sparkles />
                <small>REPOSITORIO</small>
                <h3>Código abierto</h3>
                <p>Revisa el código, licencia MIT, dependencias, modelos y pasos de instalación antes de desplegar tu propia instancia.</p>
                <a href="https://github.com/Anil-matcha/Open-Generative-AI" target="_blank" rel="noreferrer">Abrir repositorio en GitHub ↗</a>
              </article>
              <article>
                <Activity />
                <small>VERSIÓN EN NAVEGADOR</small>
                <h3>Probar el estudio</h3>
                <p>La versión alojada es un servicio externo. Puede requerir cuenta, clave/API o créditos; sus condiciones y disponibilidad no dependen de LOW.</p>
                <a href="https://muapi.ai/open-generative-ai" target="_blank" rel="noreferrer">Abrir Open Generative AI ↗</a>
              </article>
            </div>
            <article className="learningCard">
              <h3>Cómo se integra con LOW</h3>
              <p>ComfyUI sigue siendo el motor multimedia conectado directamente a CREATOR. Open Generative AI queda como estudio complementario externo; no se envían automáticamente tus conversaciones, bóveda ni archivos de LOW a ese servicio.</p>
              <small className="subtle">El repositorio es software abierto, pero no todos los modelos que ofrece ni sus APIs alojadas son necesariamente abiertos o gratuitos. El cómputo, los modelos y sus licencias tienen condiciones propias.</small>
            </article>
          </section>
        )}
        {page === 'ECC Engineering' && (
          <section className="content">
            <small>LOW AGENTS / ENGINEERING TOOLKIT</small>
            <h1>ECC <em>Engineering.</em></h1>
            <p>Conjunto de herramientas open source para mejorar el ciclo de ingeniería de los agentes: planificar, implementar, probar, revisar, verificar y conservar aprendizajes. ECC se integra en los entornos de desarrollo compatibles; no es un modelo de IA ni un motor que se ejecute dentro del chat de LOW.</p>
            <div className="grid">
              <article>
                <Bot />
                <small>FUENTE OFICIAL</small>
                <h3>Everything Claude Code</h3>
                <p>Agentes, skills, hooks, reglas, memoria y flujos de trabajo. ECC declara licencia MIT y soporte de distintos entornos con capacidades variables.</p>
                <a href="https://github.com/affaan-m/ECC" target="_blank" rel="noreferrer">Abrir ECC oficial en GitHub ↗</a>
              </article>
              <article>
                <ShieldCheck />
                <small>SEGURIDAD</small>
                <h3>AgentShield</h3>
                <p>Herramienta asociada para revisar configuraciones de agentes, permisos, hooks, MCP y secretos. Su ejecución requiere instalación y revisión separada.</p>
                <a href="https://www.npmjs.com/package/ecc-agentshield" target="_blank" rel="noreferrer">Ver paquete oficial ↗</a>
              </article>
            </div>
            <article className="learningCard">
              <h3>Estado de integración</h3>
              <p>ECC queda registrado como toolkit de ingeniería para el mantenimiento del repositorio LOW. No se instala ni ejecuta código de terceros automáticamente en el servidor de producción. Los agentes de auditoría propios de LOW continúan aislados y no reciben permisos para modificar, fusionar o desplegar cambios sin revisión humana.</p>
              <small className="subtle">Para activar sus capacidades en un entorno de desarrollo compatible, sigue las instrucciones oficiales y elige un único método de instalación por entorno para evitar duplicar hooks.</small>
            </article>
          </section>
        )}
        {page === 'Wi-Fi Security' && (
          <section className="content">
            <small>SHIELD / LOCAL NETWORK SECURITY</small>
            <h1>Wi-Fi <em>Security.</em></h1>
            <p>ORS4Net KeyHunter es una aplicación independiente para Windows que inventaría perfiles Wi-Fi guardados, evalúa su configuración y genera reportes. No es una librería web ni un servicio que pueda ejecutarse dentro del servidor de LOW.</p>
            <article className="learningCard">
              <h3>Proyecto original</h3>
              <p>Consulta el código, licencia y documentación del autor antes de instalarlo. La herramienta puede mostrar contraseñas Wi-Fi guardadas en el equipo; trátalas como secretos y no compartas capturas, exportaciones ni reportes que las incluyan.</p>
              <a href="https://github.com/n0rs4rt/Ors4Net-keyHunter" target="_blank" rel="noreferrer">Abrir ORS4Net KeyHunter en GitHub ↗</a>
            </article>
            <article className="learningCard">
              <h3>Límites de seguridad de LOW</h3>
              <p>LOW no extrae contraseñas del sistema, no recibe volcados de perfiles Wi-Fi, no valida ni reutiliza claves encontradas y no elimina ni importa perfiles. El acceso es únicamente al repositorio original para consulta.</p>
              <small className="subtle">Requiere Windows y un adaptador Wi-Fi compatible. No puede ejecutarse en tu iPhone ni dentro de GitHub Pages o del backend web de LOW. Si utilizas el programa en un equipo propio, hazlo localmente y conserva los reportes bajo tu control.</small>
            </article>
          </section>
        )}
        <footer className="foot">
          LOW INTELLIGENCE SYSTEMS <span>BUILD 03.1 · IMAGE + AGENT CORE</span>
        </footer>
      </main>
    </div>
  );
}
