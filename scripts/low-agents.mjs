#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = process.env.LOW_AGENT_REPORT_DIR || "artifacts/low-agents";
const agents = ["architecture", "security", "quality", "providers"];
const selected = process.argv.includes("--agent") ? process.argv[process.argv.indexOf("--agent")+1] : "all";
const ignored = new Set([".git", "node_modules", "dist", "coverage", "artifacts"]);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs|json|yml|yaml|md)$/.test(entry.name)) files.push(full);
  }
}
walk(root);
const read = (f) => { try { return fs.readFileSync(f,"utf8"); } catch { return ""; } };
const all = files.map(f=>({file:f, text:read(f)}));
const findings = [];
const add = (agent,severity,area,message,evidence="") => findings.push({agent,severity,area,message,evidence});
const has = (re) => all.filter(x=>re.test(x.text)).map(x=>x.file);
const exists = (p) => fs.existsSync(path.join(root,p));

function architecture() {
  if (!exists("server/index.ts")) add("architecture","high","backend","No se encontró server/index.ts; verificar el punto de entrada del backend.");
  if (!exists("src")) add("architecture","medium","frontend","No se encontró src/; verificar la ubicación del frontend.");
  if (!exists("package-lock.json")) add("architecture","medium","reproducibility","Falta package-lock.json: las instalaciones no están fijadas.");
  if (!exists(".github/workflows/ci.yml")) add("architecture","high","ci","No se encontró el workflow CI principal.");
  if (!has(/LOW_DATA_DIR|better-sqlite3/).length) add("architecture","medium","persistence","No se detectó configuración de persistencia SQLite.");
}
function security() {
  const secretFiles = files.filter(f=>/\.env$|\.pem$|\.key$|id_rsa/i.test(f));
  for (const f of secretFiles) add("security","critical","secret-hygiene",`Archivo potencialmente sensible versionado: ${f}`);
  const clientSecrets = has(/HF_API_KEY_SECRET|LOW_AI_API_KEY|TAVILY_API_KEY/).filter(f=>f.startsWith("src/"));
  for (const f of clientSecrets) add("security","high","secret-boundary",`Referencia a variable secreta dentro del frontend: ${f}`);
  if (!has(/HttpOnly/i).length) add("security","medium","sessions","No se detectó la bandera HttpOnly en el código inspeccionado.");
  if (!has(/SameSite/i).length) add("security","medium","sessions","No se detectó SameSite en el código inspeccionado.");
  if (!has(/rate.?limit|rateLimit/i).length) add("security","medium","abuse-controls","No se detectó rate limiting.");
  if (!has(/helmet|Content-Security-Policy|contentSecurityPolicy/i).length) add("security","medium","headers","No se detectó configuración explícita de cabeceras/CSP en el código inspeccionado.");
}
function quality() {
  if (!exists("tests") && !files.some(x=>/\.test\.|\.spec\./.test(x.file))) add("quality","high","tests","No se encontraron pruebas automatizadas.");
  const scripts = JSON.parse(read("package.json") || "{}").scripts || {};
  for (const key of ["check","build","test"]) if (!scripts[key]) add("quality","medium","scripts",`Falta el script npm ${key}.`);
  const anyTsIgnore = has(/@ts-ignore|@ts-nocheck/);
  for (const f of anyTsIgnore) add("quality","low","typescript",`Directiva TypeScript que reduce comprobaciones: ${f}`);
}
function providers() {
  const providerRefs = all.filter(x=>/higgsfield|hillfit|comfyui|stability|replicate/i.test(x.text));
  const names = [...new Set(providerRefs.flatMap(x=>(x.text.match(/higgsfield|hillfit|comfyui|stability|replicate/ig)||[]).map(s=>s.toLowerCase())))];
  if (names.includes("higgsfield")) add("providers","info","creator","Se detectó integración Higgsfield. Es un proveedor externo; el auditor no intenta eludir autenticación, cuotas ni facturación.",providerRefs.map(x=>x.file).join(", "));
  if (names.includes("hillfit")) add("providers","medium","unknown-provider","Se detectó el término Hillfit; confirmar si es un error tipográfico, nombre de paquete o proveedor real.",providerRefs.map(x=>x.file).join(", "));
  if (!names.includes("comfyui")) add("providers","info","cost-alternative","No se detectó adaptador ComfyUI. Alternativa legal a un proveedor de pago: integrar un servidor ComfyUI propio con modelos de licencia compatible; el cómputo/hosting puede tener coste.");
  if (!providerRefs.length) add("providers","low","provider-inventory","No se detectaron referencias conocidas a proveedores de generación.");
}
const runners = {architecture,security,quality,providers};
for (const [name,run] of Object.entries(runners)) if (selected==="all" || selected===name) run();
if (selected!=="all" && !runners[selected]) { console.error("Agente desconocido:",selected); process.exit(2); }
const summary = {generatedAt:new Date().toISOString(), branch:process.env.GITHUB_REF_NAME||"local", commit:process.env.GITHUB_SHA||"local", scannedFiles:files.length, agents:selected==="all"?agents:[selected], findings};
fs.mkdirSync(path.join(root,outDir),{recursive:true});
fs.writeFileSync(path.join(root,outDir,`${selected}.json`),JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
if (findings.some(x=>x.severity==="critical")) process.exitCode=1;
