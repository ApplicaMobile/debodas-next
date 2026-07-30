import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hashMicrositePassword,
  isMicrositePasswordHash,
  verifyMicrositePassword,
} from "@/lib/microsite/password";

describe("microsite password", () => {
  it("hashea y verifica bcrypt", async () => {
    const hashed = await hashMicrositePassword("secreto123");
    assert.equal(isMicrositePasswordHash(hashed), true);
    assert.equal(hashed.includes("secreto123"), false);

    const ok = await verifyMicrositePassword("secreto123", hashed);
    assert.equal(ok.ok, true);
    assert.equal(ok.legacyPlain, undefined);

    const bad = await verifyMicrositePassword("otra", hashed);
    assert.equal(bad.ok, false);
  });

  it("acepta plaintext legacy y marca legacyPlain", async () => {
    const result = await verifyMicrositePassword("vieja", "vieja");
    assert.equal(result.ok, true);
    assert.equal(result.legacyPlain, true);
  });

  it("rechaza plaintext incorrecto", async () => {
    const result = await verifyMicrositePassword("x", "vieja");
    assert.equal(result.ok, false);
  });
});
