export type ValidationResult = { valid: boolean; message: string; details: string[] };

export function validateJson(raw: string, required: string): ValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, message: "No hay datos para validar.", details: ["Pega un JSON o carga un archivo de texto."] };
  try {
    const value: unknown = JSON.parse(trimmed);
    const details = ["JSON sintácticamente válido."];
    if (required.trim()) {
      const keys = required.split(",").map((key) => key.trim()).filter(Boolean);
      if (value === null || Array.isArray(value) || typeof value !== "object") {
        return { valid: false, message: "El contenido no es un objeto JSON.", details };
      }
      const missing = keys.filter((key) => !(key in value));
      if (missing.length) return { valid: false, message: "Faltan campos obligatorios.", details: [...details, "Campos ausentes: " + missing.join(", ")] };
      details.push("Campos requeridos presentes: " + keys.join(", "));
    }
    return { valid: true, message: "Validación completada.", details };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de sintaxis";
    return { valid: false, message: "JSON no válido.", details: [message] };
  }
}

export function validateCsv(raw: string): ValidationResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (quoted) {
      if (char === '"' && raw[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") { row.push(field.trim()); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && raw[i + 1] === "\n") i += 1;
      row.push(field.trim()); field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) return { valid: false, message: "CSV no válido.", details: ["Hay un campo entre comillas que no se cerró."] };
  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (rows.length < 2) return { valid: false, message: "CSV incompleto.", details: ["Se requiere una fila de encabezados y al menos una fila de datos."] };
  const headers = rows[0];
  const duplicates = headers.filter((value, index) => !value || headers.indexOf(value) !== index);
  const widths = rows.slice(1).map((values, index) => ({ row: index + 2, count: values.length })).filter((item) => item.count !== headers.length);
  const details = [headers.length + " columnas detectadas.", rows.length - 1 + " filas de datos."];
  if (duplicates.length) details.push("Encabezados vacíos o duplicados: " + [...new Set(duplicates)].join(", "));
  if (widths.length) details.push("Filas con número de columnas distinto: " + widths.map((item) => item.row).join(", "));
  return { valid: !duplicates.length && !widths.length, message: duplicates.length || widths.length ? "Se encontraron inconsistencias." : "Estructura CSV consistente.", details };
}
