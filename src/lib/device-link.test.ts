import test from "node:test";
import assert from "node:assert/strict";
import { detectDeviceCapabilities, describeConnectionCommand, recommendTransports } from "./device-link";

test("detecta Android sin asumir capacidades Bluetooth", () => {
  const caps = detectDeviceCapabilities({ userAgent: "Mozilla/5.0 Android 14", online: true, canShare: true, canUseBluetooth: false, canUseCamera: true });
  assert.equal(caps.platform, "android");
  assert.equal(recommendTransports(caps).find(x => x.id === "bluetooth")?.available, false);
});

test("prioriza QR cuando hay cámara y conexión", () => {
  const caps = detectDeviceCapabilities({ userAgent: "iPhone", online: true, canShare: true, canUseBluetooth: false, canUseCamera: true });
  assert.match(describeConnectionCommand(caps), /qr-link/);
});

test("da alternativa offline sin inventar conexión", () => {
  const caps = detectDeviceCapabilities({ userAgent: "Linux", online: false, canShare: false, canUseBluetooth: false, canUseCamera: false });
  assert.match(describeConnectionCommand(caps), /Conecta el equipo/);
});
