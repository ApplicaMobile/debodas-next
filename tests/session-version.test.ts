import assert from "node:assert/strict";
import test from "node:test";
import { sessionVersionMatches } from "../src/lib/auth/session";

test("acepta la misma versión de sesión", () => {
  assert.equal(sessionVersionMatches(0, 0), true);
  assert.equal(sessionVersionMatches(3, 3), true);
});

test("rechaza versiones distintas o inválidas", () => {
  assert.equal(sessionVersionMatches(0, 1), false);
  assert.equal(sessionVersionMatches(2, 1), false);
  assert.equal(sessionVersionMatches(1.5, 1), false);
});
