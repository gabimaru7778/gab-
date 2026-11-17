type WorkflowNode = { inputs?: Record<string, unknown>; [key: string]: unknown };
type Workflow = Record<string, WorkflowNode>;

function configuredWorkflow(kind: "image" | "video", prompt: string): Workflow {
  const raw = kind === "video" ? process.env.LOW_COMFYUI_VIDEO_WORKFLOW : process.env.LOW_COMFYUI_IMAGE_WORKFLOW;
  if (!raw) throw Object.assign(new Error(`CREATOR requiere ${kind === "video" ? "LOW_COMFYUI_VIDEO_WORKFLOW" : "LOW_COMFYUI_IMAGE_WORKFLOW"} con un workflow API de ComfyUI.`), { status: 503 });
  let workflow: Workflow;
  try { workflow = JSON.parse(raw) as Workflow; } catch { throw Object.assign(new Error("El workflow JSON de ComfyUI no es válido."), { status: 503 }); }
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) throw Object.assign(new Error("El workflow debe ser un objeto API de ComfyUI."), { status: 503 });
  let replacements = 0;
  const visit = (value: unknown): unknown => {
    if (typeof value === "string" && ["{{PROMPT}}", "__LOW_PROMPT__", "{{prompt}}"].includes(value)) { replacements++; return prompt; }
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,visit(v)]));
    return value;
  };
  const result = visit(workflow) as Workflow;
  if (!replacements) throw Object.assign(new Error("El workflow necesita un campo de texto con el marcador {{PROMPT}}."), { status: 503 });
  return result;
}

function comfyBase(): string {
  const base = process.env.LOW_COMFYUI_URL?.trim().replace(/\/$/, "");
  if (!base || !/^https?:\/\//.test(base)) throw Object.assign(new Error("Configura LOW_COMFYUI_URL con la dirección privada del servidor ComfyUI."), { status: 503 });
  return base;
}

export async function submitComfyJob(kind: "image" | "video", prompt: string): Promise<{ jobId: string; status: string }> {
  const base = comfyBase();
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(base + "/prompt", { method: "POST", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: configuredWorkflow(kind, prompt) }) });
    const data = await response.json().catch(() => ({})) as any;
    if (!response.ok || typeof data.prompt_id !== "string") throw Object.assign(new Error(String(data?.error?.message || data?.message || "ComfyUI no aceptó el workflow.")), { status: response.status === 429 ? 429 : 502 });
    return { jobId: data.prompt_id, status: "queued" };
  } catch (e: any) {
    if (e.name === "AbortError") throw Object.assign(new Error("ComfyUI tardó demasiado en aceptar la generación."), { status: 504 });
    throw e;
  } finally { clearTimeout(timer); }
}

export async function pollComfyJob(jobId: string): Promise<{ status: string; mediaUrl?: string; error?: string }> {
  const base = comfyBase();
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(base + "/history/" + encodeURIComponent(jobId), { signal: controller.signal });
    const history = await response.json().catch(() => ({})) as any;
    if (!response.ok) throw Object.assign(new Error("No se pudo consultar el trabajo en ComfyUI."), { status: 502 });
    const entry = history?.[jobId];
    if (entry) {
      const statusText = String(entry?.status?.status_str || "").toLowerCase();
      if (statusText === "error" || entry?.status?.completed === false && entry?.status?.messages?.some((m: any[]) => m?.[0] === "execution_error")) return { status: "failed", error: "ComfyUI no pudo completar el workflow." };
      const outputFiles: any[] = [];
      for (const node of Object.values(entry.outputs || {}) as any[]) {
        for (const key of ["images", "videos", "gifs"]) if (Array.isArray(node?.[key])) outputFiles.push(...node[key]);
      }
      const file = outputFiles.find(x => typeof x?.filename === "string");
      if (file) {
        const publicBase = (process.env.LOW_COMFYUI_PUBLIC_URL || base).trim().replace(/\/$/, "");
        const params = new URLSearchParams({ filename: file.filename, subfolder: String(file.subfolder || ""), type: String(file.type || "output") });
        return { status: "completed", mediaUrl: publicBase + "/view?" + params.toString() };
      }
      if (entry?.status?.completed === true) return { status: "failed", error: "ComfyUI terminó sin devolver un archivo de imagen o vídeo." };
    }
    return { status: "processing" };
  } catch (e: any) {
    if (e.name === "AbortError") throw Object.assign(new Error("La consulta a ComfyUI agotó el tiempo de espera."), { status: 504 });
    throw e;
  } finally { clearTimeout(timer); }
}
