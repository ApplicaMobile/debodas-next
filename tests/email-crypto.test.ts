import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptEmailContent,
  encryptEmailContent,
} from "../src/lib/email/crypto";

test("cifra y recupera el contenido de un email", () => {
  const html = "<p>Contenido privado de prueba</p>";
  const encrypted = encryptEmailContent(html);

  assert.notEqual(encrypted, html);
  assert.equal(encrypted.includes("Contenido privado"), false);
  assert.equal(decryptEmailContent(encrypted), html);
});

test("rechaza contenido cifrado alterado", () => {
  const encrypted = encryptEmailContent("<p>Original</p>");
  const tampered = `${encrypted.slice(0, -2)}AA`;

  assert.throws(() => decryptEmailContent(tampered));
});
