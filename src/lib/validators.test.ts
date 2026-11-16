import test from "node:test";
import assert from "node:assert/strict";
import { validateCsv, validateJson } from "./validators";

test("JSON accepts an object with all required fields", () => {
  assert.equal(validateJson('{"name":"LOW","version":"1"}', "name, version").valid, true);
});

test("JSON reports missing required fields", () => {
  const result = validateJson('{"name":"LOW"}', "name, version");
  assert.equal(result.valid, false);
  assert.match(result.details.join(" "), /version/);
});

test("CSV accepts quoted commas and consistent columns", () => {
  assert.equal(validateCsv('id,name\n1,"LOW, assistant"\n2,Agent').valid, true);
});

test("CSV rejects inconsistent row widths", () => {
  assert.equal(validateCsv("id,name\n1,LOW,extra").valid, false);
});

test("CSV rejects an unclosed quote", () => {
  assert.equal(validateCsv('id,name\n1,"LOW').valid, false);
});
