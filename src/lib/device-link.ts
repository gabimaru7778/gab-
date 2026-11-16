export type DevicePlatform = "android" | "ios" | "desktop" | "other";
export type DeviceTransport = "qr-link" | "local-network" | "bluetooth" | "secure-relay";
export type TransportState = "ready" | "needs-service" | "needs-agent" | "needs-native-bridge" | "unsupported";
export type DeviceCapabilities = {
  platform: DevicePlatform;
  canShare: boolean;
  canUseBluetooth: boolean;
  canUseCamera: boolean;
  online: boolean;
};
export type TransportOption = {
  id: DeviceTransport;
  state: TransportState;
  capabilityDetected: boolean;
  available: boolean;
  reason: string;
  requiresConsent: true;
};

export function detectDeviceCapabilities(input: {
  userAgent: string;
  online: boolean;
  canShare: boolean;
  canUseBluetooth: boolean;
  canUseCamera: boolean;
}): DeviceCapabilities {
  const ua = input.userAgent.toLowerCase();
  const platform: DevicePlatform = /android/.test(ua) ? "android" :
    /iphone|ipad|ipod/.test(ua) ? "ios" :
    /windows|macintosh|linux|x11/.test(ua) ? "desktop" : "other";
  return { platform, online: input.online, canShare: input.canShare,
    canUseBluetooth: input.canUseBluetooth, canUseCamera: input.canUseCamera };
}

/**
 * Reports platform capabilities separately from LOW implementation readiness.
 * A browser API being present does not mean a LOW pairing service is deployed.
 */
export function recommendTransports(caps: DeviceCapabilities): TransportOption[] {
  const qrCapable = caps.online && caps.canUseCamera;
  const lanCapable = caps.online;
  const bluetoothCapable = caps.platform === "android" && caps.canUseBluetooth;
  const relayCapable = caps.online;
  return [
    { id: "qr-link", state: qrCapable ? "needs-service" : "unsupported",
      capabilityDetected: qrCapable, available: false,
      reason: qrCapable ? "La cámara y la conexión están disponibles. Falta desplegar el servicio LOW de códigos temporales y aprobación mutua." : "Se requiere cámara disponible y conexión al servicio LOW de emparejamiento.",
      requiresConsent: true },
    { id: "local-network", state: lanCapable ? "needs-agent" : "unsupported",
      capabilityDetected: lanCapable, available: false,
      reason: lanCapable ? "La red está disponible. Falta el agente LOW del otro equipo y un descubrimiento LAN limitado a la red autorizada." : "Conecta ambos equipos a una red disponible.",
      requiresConsent: true },
    { id: "bluetooth", state: bluetoothCapable ? "needs-native-bridge" : "unsupported",
      capabilityDetected: bluetoothCapable, available: false,
      reason: bluetoothCapable ? "Android expone una ruta de emparejamiento potencial. Falta integrar Companion Device Manager y el canal de datos nativo." : "Este entorno no ofrece el puente Bluetooth nativo de LOW.",
      requiresConsent: true },
    { id: "secure-relay", state: relayCapable ? "needs-service" : "unsupported",
      capabilityDetected: relayCapable, available: false,
      reason: relayCapable ? "Hay conexión a Internet. Falta desplegar LOW Sync con identidades de dispositivo, cifrado y aprobación de ambos extremos." : "Necesita conexión a Internet.",
      requiresConsent: true }
  ];
}

export function describeConnectionCommand(caps: DeviceCapabilities): string {
  const options = recommendTransports(caps);
  const preference: DeviceTransport[] = caps.platform === "android"
    ? ["bluetooth", "qr-link", "local-network", "secure-relay"]
    : ["qr-link", "secure-relay", "local-network", "bluetooth"];
  const preferred = preference.map((id) => options.find((option) => option.id === id))
    .find((option) => option?.capabilityDetected);
  if (!preferred) return "No detecté una vía compatible en este momento. Conecta el equipo a Internet o activa una capacidad de proximidad y vuelve a intentarlo.";
  return "LOW detectó " + caps.platform + " y recomienda " + preferred.id +
    ". Estado: " + preferred.state + ". Esta versión aún no completa el emparejamiento; requiere el componente indicado y aprobación en ambos equipos.";
}
