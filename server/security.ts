export function parseAllowedOrigins(raw: string | undefined, development: boolean): Set<string> {
  const configured = raw?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  if (configured.length) return new Set(configured);
  return new Set(development ? ["http://localhost:5173"] : []);
}

export function isAllowedOrigin(origin: string | undefined, allowed: Set<string>): boolean {
  // Requests without Origin are common for native clients and server-to-server calls.
  if (!origin) return true;
  return allowed.has(origin);
}
