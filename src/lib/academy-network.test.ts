import test from "node:test";
import assert from "node:assert/strict";
import { buildWifiScenario, buildWifiExecutionTrace, simulateStealthDetection } from "./academy-network";

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
