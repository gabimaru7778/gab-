export type WifiLabProfile = "home" | "office" | "guest";
export type LabEvent = { id: string; title: string; detail: string; severity: "info" | "warning" | "success" };
export type LabDevice = { id: string; name: string; role: "router" | "client" | "service"; address: string; trust: "trusted" | "untrusted" };
export type WifiLabScenario = { profile: WifiLabProfile; ssid: string; devices: LabDevice[]; events: LabEvent[]; boundary: string };

const PROFILES: Record<WifiLabProfile, WifiLabScenario> = {
  home: {
    profile: "home", ssid: "LOW-LAB-HOME (ficticia)", boundary: "Topología inventada en memoria: no crea un punto de acceso ni transmite paquetes.",
    devices: [
      { id: "gw", name: "Router virtual", role: "router", address: "192.0.2.1", trust: "trusted" },
      { id: "phone", name: "Móvil de prueba", role: "client", address: "192.0.2.10", trust: "trusted" },
      { id: "laptop", name: "Portátil de laboratorio", role: "client", address: "192.0.2.11", trust: "trusted" },
      { id: "sensor", name: "Sensor simulado", role: "service", address: "192.0.2.20", trust: "untrusted" }
    ],
    events: [
      { id: "e1", title: "Red virtual creada", detail: "Se construyó una topología ficticia con cuatro nodos.", severity: "success" },
      { id: "e2", title: "Cliente asociado", detail: "El móvil de prueba se asoció al router virtual; evento generado localmente.", severity: "info" },
      { id: "e3", title: "Tráfico sintético observado", detail: "Se añadieron metadatos ficticios de DNS y HTTPS; no se capturó tráfico real.", severity: "info" },
      { id: "e4", title: "Segmentación recomendada", detail: "El sensor no confiable debe quedar aislado de los clientes personales.", severity: "warning" }
    ]
  },
  office: {
    profile: "office", ssid: "LOW-LAB-OFFICE (ficticia)", boundary: "Escenario de oficina inventado; no descubre ni enumera equipos reales.",
    devices: [
      { id: "gw", name: "Gateway virtual", role: "router", address: "198.51.100.1", trust: "trusted" },
      { id: "admin", name: "Estación administradora", role: "client", address: "198.51.100.10", trust: "trusted" },
      { id: "guest", name: "Equipo invitado", role: "client", address: "198.51.100.50", trust: "untrusted" },
      { id: "files", name: "Servidor de archivos ficticio", role: "service", address: "198.51.100.20", trust: "trusted" }
    ],
    events: [
      { id: "e1", title: "Segmentos virtuales creados", detail: "Red interna e invitados representados como segmentos separados.", severity: "success" },
      { id: "e2", title: "Solicitud de invitado", detail: "El equipo invitado intenta acceder al servidor ficticio.", severity: "warning" },
      { id: "e3", title: "Política aplicada", detail: "La simulación bloquea el acceso entre invitados y recursos internos.", severity: "success" },
      { id: "e4", title: "Registro de auditoría", detail: "Se conserva el evento con origen, destino y decisión simulados.", severity: "info" }
    ]
  },
  guest: {
    profile: "guest", ssid: "LOW-LAB-GUEST (ficticia)", boundary: "Red de invitados ficticia; los resultados no representan una red Wi-Fi real.",
    devices: [
      { id: "gw", name: "Punto de acceso virtual", role: "router", address: "203.0.113.1", trust: "trusted" },
      { id: "guest1", name: "Invitado A", role: "client", address: "203.0.113.10", trust: "untrusted" },
      { id: "guest2", name: "Invitado B", role: "client", address: "203.0.113.11", trust: "untrusted" }
    ],
    events: [
      { id: "e1", title: "Aislamiento entre clientes", detail: "Los clientes invitados no pueden comunicarse entre sí en este modelo.", severity: "success" },
      { id: "e2", title: "Intento lateral simulado", detail: "Invitado A intenta alcanzar a Invitado B; la política lo bloquea.", severity: "warning" },
      { id: "e3", title: "Telemetría ficticia", detail: "Solo se muestran eventos sintéticos, sin paquetes ni direcciones reales.", severity: "info" }
    ]
  }
};

export function buildWifiScenario(profile: WifiLabProfile): WifiLabScenario {
  const scenario = PROFILES[profile];
  return { ...scenario, devices: scenario.devices.map((device) => ({ ...device })), events: scenario.events.map((event) => ({ ...event })) };
}

export type ExecutionStep = { id: string; phase: string; action: string; output: string; status: "planned" | "completed" };
export function buildWifiExecutionTrace(profile: WifiLabProfile): ExecutionStep[] {
  const scenario = buildWifiScenario(profile);
  return [
    { id: "plan", phase: "1 · Planificación", action: "Interpretar la orden y fijar límites", output: "Modo simulado; sin sockets, escaneo, captura ni cambios de configuración del sistema.", status: "planned" },
    { id: "topology", phase: "2 · Topología", action: "Crear red y dispositivos virtuales", output: scenario.ssid + " · " + scenario.devices.length + " nodos ficticios.", status: "planned" },
    { id: "traffic", phase: "3 · Actividad", action: "Generar eventos sintéticos", output: scenario.events.length + " eventos preparados para inspección.", status: "planned" },
    { id: "analysis", phase: "4 · Análisis", action: "Evaluar confianza y segmentación", output: "Identificar dispositivos no confiables y aplicar reglas de aislamiento simuladas.", status: "planned" },
    { id: "report", phase: "5 · Informe", action: "Presentar hallazgos y siguientes pasos", output: "Mostrar topología, eventos, recomendaciones y registro reproducible.", status: "planned" }
  ];
}

export function simulateStealthDetection(): LabEvent[] {
  return [
    { id: "s1", title: "Comportamiento anómalo detectado", detail: "Un nodo ficticio intenta ocultar su identidad en la simulación.", severity: "warning" },
    { id: "s2", title: "Controles defensivos alertan", detail: "La política detecta cambio de identificador y actividad fuera del perfil esperado.", severity: "success" },
    { id: "s3", title: "Acción segura", detail: "El nodo de laboratorio queda aislado; se preserva el registro para análisis.", severity: "success" }
  ];
}
