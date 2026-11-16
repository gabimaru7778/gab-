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

test("JSON checks own properties rather than prototype properties", () => {
  assert.equal(validateJson('{"name":"LOW"}', "__proto__").valid, false);
});

test("CSV accepts quoted commas and consistent columns", () => {
  assert.equal(validateCsv('id,name\n1,"LOW, assistant"\n2,Agent').valid, true);
});

test("CSV accepts CRLF and escaped quotes", () => {
  assert.equal(validateCsv('id,name\r\n1,"LOW ""core"""\r\n2,Agent').valid, true);
});

test("CSV rejects inconsistent row widths", () => {
  assert.equal(validateCsv("id,name\n1,LOW,extra").valid, false);
});

test("CSV rejects an unclosed quote", () => {
  assert.equal(validateCsv('id,name\n1,"LOW').valid, false);
});

test("CSV rejects an unescaped quote in a bare field", () => {
  assert.equal(validateCsv('id,name\n1,LO"W').valid, false);
});

test("CSV rejects text after a quoted field", () => {
  assert.equal(validateCsv('id,name\n1,"LOW"oops').valid, false);
});

test("CSV rejects duplicate and empty headers", () => {
  assert.equal(validateCsv("id,id,\n1,2,3").valid, false);
});
