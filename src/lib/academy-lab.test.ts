import test from "node:test";
import assert from "node:assert/strict";
import { simulateAuthLab } from "./academy-lab";

test("demo credentials work in parameterized mode", () => {
  assert.equal(simulateAuthLab("ana", "demo-123", "parameterized").authenticated, true);
});

test("demo credentials work in vulnerable mode", () => {
  assert.equal(simulateAuthLab("profesor", "lab-456", "vulnerable").authenticated, true);
});

test("teaching injection succeeds only in vulnerable simulation", () => {
  const input = "' OR '1'='1";
  assert.equal(simulateAuthLab(input, "x", "vulnerable").authenticated, true);
  assert.equal(simulateAuthLab(input, "x", "parameterized").authenticated, false);
});

test("unknown literal credentials are denied in both modes", () => {
  assert.equal(simulateAuthLab("nobody", "wrong", "vulnerable").authenticated, false);
  assert.equal(simulateAuthLab("nobody", "wrong", "parameterized").authenticated, false);
});
