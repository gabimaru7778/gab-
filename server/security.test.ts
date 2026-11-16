import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin, parseAllowedOrigins } from "./security";

test("development allows the Vite origin by default", () => {
  assert.equal(isAllowedOrigin("http://localhost:5173", parseAllowedOrigins(undefined, true)), true);
});

test("production does not silently allow browser origins", () => {
  assert.equal(isAllowedOrigin("https://unknown.example", parseAllowedOrigins(undefined, false)), false);
});

test("configured origins are exact and comma separated", () => {
  const allowed = parseAllowedOrigins("https://localhost,https://low.example", false);
  assert.equal(isAllowedOrigin("https://localhost", allowed), true);
  assert.equal(isAllowedOrigin("https://low.example.evil", allowed), false);
});

test("native and server-to-server requests without Origin remain possible", () => {
  assert.equal(isAllowedOrigin(undefined, new Set()), true);
});
