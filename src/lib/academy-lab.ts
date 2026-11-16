export type AuthLabMode = "vulnerable" | "parameterized";
export type AuthLabResult = {
  authenticated: boolean;
  account: string | null;
  role: string | null;
  queryPreview: string;
  explanation: string;
};

const DEMO_ACCOUNTS = [
  { username: "ana", password: "demo-123", role: "estudiante" },
  { username: "profesor", password: "lab-456", role: "docente" }
] as const;

/**
 * Offline teaching simulation only. It does not connect to or execute SQL against a database.
 */
export function simulateAuthLab(username: string, password: string, mode: AuthLabMode): AuthLabResult {
  const injectionPattern = /(?:'|%27)\s*or\s*(?:'1'|'?1'?)\s*=\s*(?:'1'|'?1'?)/i;
  const injectionAttempt = injectionPattern.test(username) || injectionPattern.test(password);
  const queryPreview = mode === "vulnerable"
    ? "SELECT * FROM users WHERE username = '" + username.replace(/'/g, "''") + "' AND password = '[entrada]';"
    : "SELECT * FROM users WHERE username = ? AND password = ?;  -- parámetros separados";

  if (mode === "vulnerable" && injectionAttempt) {
    return { authenticated: true, account: "ana", role: "estudiante", queryPreview,
      explanation: "Simulación: la condición inyectada altera la lógica de la consulta concatenada y devuelve el primer registro de demostración. No se ejecutó SQL real." };
  }

  const account = DEMO_ACCOUNTS.find((item) => item.username === username && item.password === password);
  if (account) {
    return { authenticated: true, account: account.username, role: account.role, queryPreview,
      explanation: mode === "parameterized"
        ? "Acceso de demostración correcto. Los valores se tratan como datos separados de la instrucción."
        : "Acceso de demostración correcto con credenciales ficticias." };
  }

  return { authenticated: false, account: null, role: null, queryPreview,
    explanation: mode === "parameterized"
      ? "Acceso denegado. La entrada se compara como dato literal; no puede modificar la estructura de la consulta."
      : injectionAttempt
        ? "La simulación no reconoció el patrón educativo; prueba el ejemplo indicado."
        : "Acceso denegado. Usuario o contraseña ficticios incorrectos." };
}
