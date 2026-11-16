export type DevicePlatform = "android" | "ios" | "desktop" | "other";
export type DeviceTransport = "qr-link" | "local-network" | "bluetooth" | "secure-relay";
export type DeviceCapabilities = {
  platform: DevicePlatform;
  canShare: boolean;
  canUseBluetooth: boolean;
  canUseCamera: boolean;
  online: boolean;
};
export type TransportOption = {
  id: DeviceTransport;
  available: boolean;
  reason: string;
  requiresConsent: boolean;
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

export function recommendTransports(caps: DeviceCapabilities): TransportOption[] {
  return [
    { id: "qr-link", available: caps.online && caps.canUseCamera,
      reason: caps.online && caps.canUseCamera ? "Vinculación entre pantallas mediante QR y confirmación en ambos equipos." : "Requiere cámara y un servicio de emparejamiento LOW accesible.",
      requiresConsent: true },
    { id: "local-network", available: caps.online,
      reason: caps.online ? "Adecuado para equipos en la misma Wi-Fi; necesita permiso de red local y un agente LOW en el otro equipo." : "Conecta ambos equipos a una red disponible.",
      requiresConsent: true },
    { id: "bluetooth", available: caps.canUseBluetooth,
      reason: caps.canUseBluetooth ? "Disponible como capacidad del navegador o puente nativo; el sistema debe autorizar el emparejamiento." : "Este entorno no expone Bluetooth; en Android se integrará el selector nativo de dispositivos complementarios.",
      requiresConsent: true },
    { id: "secure-relay", available: caps.online,
      reason: caps.online ? "Opción universal entre redes distintas cuando LOW Sync esté desplegado y ambos equipos autoricen la sesión." : "Necesita conexión a Internet.",
      requiresConsent: true }
  ];
}

export function describeConnectionCommand(caps: DeviceCapabilities): string {
  const preferred = recommendTransports(caps).find((option) => option.available);
  if (!preferred) return "Conecta el equipo a Internet o activa un método de proximidad compatible y vuelve a intentarlo.";
  return "LOW detectó " + caps.platform + " y recomienda " + preferred.id +
    ". La vinculación final requiere servicio LOW Sync, confirmación en ambos equipos y permisos del sistema.";
}
