import assert from "node:assert/strict";
import test from "node:test";
import {
  detectLocaleFromHeader,
  parseLocale,
} from "../src/i18n/config";
import { getMessages, interpolate, t } from "../src/i18n/dictionary";

test("parseLocale acepta es, en y pt y cae a es", () => {
  assert.equal(parseLocale("es"), "es");
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("pt"), "pt");
  assert.equal(parseLocale("fr"), "es");
  assert.equal(parseLocale(undefined), "es");
});

test("detectLocaleFromHeader prioriza pt y en", () => {
  assert.equal(detectLocaleFromHeader("pt-BR,pt;q=0.9"), "pt");
  assert.equal(detectLocaleFromHeader("en-US,en;q=0.8"), "en");
  assert.equal(detectLocaleFromHeader("es-AR,es;q=0.9"), "es");
  assert.equal(detectLocaleFromHeader(null), "es");
});

test("t resuelve claves anidadas e interpola", () => {
  const es = getMessages("es");
  const en = getMessages("en");
  const pt = getMessages("pt");

  assert.equal(t(es, "header.login"), "Ingresar");
  assert.equal(t(en, "header.login"), "Log in");
  assert.equal(t(pt, "header.login"), "Entrar");
  assert.equal(t(en, "home.reviewsStars", { count: 5 }), "5 out of 5 stars");
  assert.equal(interpolate("Hola {name}", { name: "Ana" }), "Hola Ana");
  assert.equal(t(es, "header.login.missing" as "header.login"), "header.login.missing");
});
