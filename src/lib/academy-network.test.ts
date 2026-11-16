import test from "node:test";
import assert from "node:assert/strict";
import { buildWifiScenario, buildWifiExecutionTrace, simulateStealthDetection, simulateSensorConsent, simulateEmergencyShutdown } from "./academy-network";

test("Wi-Fi scenarios are fictional and return isolated copies", () => {
  const first = buildWifiScenario("home");
  const second = buildWifiScenario("home");
  assert.equal(first.devices.length, 4);
  assert.notEqual(first.devices, second.devices);
  assert.match(first.boundary, /no crea un punto de acceso/i);
});

test("execution trace is ordered and explicitly simulated", () => {
  const trace = buildWifiExecutionTrace("office");
  assert.deepEqual(trace.map((step) => step.id), ["plan", "topology", "traffic", "analysis", "report"]);
  assert.match(trace[0].output, /sin sockets/i);
});

test("stealth behavior is detected and isolated without deleting audit evidence", () => {
  const events = simulateStealthDetection();
  assert.equal(events.length, 3);
  assert.ok(events.some((event) => /aislado/i.test(event.detail)));
  assert.ok(events.some((event) => /registro/i.test(event.detail)));
});

test("sensor permissions are synthetic and never imply real sensor access", () => {
  const approved = simulateSensorConsent("camera", true);
  const denied = simulateSensorConsent("microphone", false);
  assert.match(approved[0].detail, /no se accedió a ningún sensor real/i);
  assert.match(denied[0].detail, /ningún sensor real fue solicitado/i);
});
test("emergency shutdown clears only virtual state and preserves audit", () => {
  const events = simulateEmergencyShutdown();
  assert.equal(events.length, 3);
  assert.ok(events.some((event) => /estado efímero eliminado/i.test(event.detail)));
  assert.ok(events.some((event) => /auditoría preservada/i.test(event.title)));
});
