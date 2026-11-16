import test from "node:test";
import assert from "node:assert/strict";
import { detectDeviceCapabilities, describeConnectionCommand, recommendTransports } from "./device-link";

const caps = (overrides: Partial<Parameters<typeof detectDeviceCapabilities>[0]> = {}) =>
  detectDeviceCapabilities({ userAgent: "Android 14", online: true, canShare: true, canUseBluetooth: true, canUseCamera: true, ...overrides });

test("detecta Android y no confunde una API nativa con conexión ya establecida", () => {
  const result = caps();
  assert.equal(result.platform, "android");
  const bluetooth = recommendTransports(result).find((x) => x.id === "bluetooth");
  assert.equal(bluetooth?.capabilityDetected, true);
  assert.equal(bluetooth?.available, false);
  assert.equal(bluetooth?.state, "needs-native-bridge");
});

test("prioriza el puente Bluetooth nativo potencial en Android", () => {
  assert.match(describeConnectionCommand(caps()), /bluetooth/);
});

test("iOS recomienda QR si hay cámara y red, pero informa del servicio faltante", () => {
  const result = caps({ userAgent: "iPhone", canUseBluetooth: false });
  assert.match(describeConnectionCommand(result), /qr-link/);
  assert.equal(recommendTransports(result)[0].state, "needs-service");
});

test("escritorio no declara Bluetooth web como puente LOW nativo", () => {
  const result = caps({ userAgent: "Macintosh", canUseBluetooth: true });
  assert.equal(result.platform, "desktop");
  assert.equal(recommendTransports(result).find((x) => x.id === "bluetooth")?.state, "unsupported");
});

test("offline no recomienda servicios de red como disponibles", () => {
  const result = caps({ online: false, canUseCamera: false, canUseBluetooth: false });
  assert.match(describeConnectionCommand(result), /No detecté una vía compatible/);
  assert.equal(recommendTransports(result).some((x) => x.available), false);
});

test("ningún transporte se marca activo antes de integrar el servicio o puente", () => {
  const result = caps();
  assert.equal(recommendTransports(result).every((x) => x.available === false), true);
});
