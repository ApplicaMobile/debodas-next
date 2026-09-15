import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMercadoPagoFormUpdate,
  resolveMercadoPagoConfig,
  sandboxModeFromStored,
} from "../src/lib/mercadopago/settings";
import { isEncryptedSecret } from "../src/lib/security/secrets";

test("prioriza el token de la base sobre el de entorno", () => {
  const config = resolveMercadoPagoConfig({
    stored: { accessToken: "APP_USR-db" },
    envAccessToken: "APP_USR-env",
  });
  assert.equal(config.accessToken, "APP_USR-db");
  assert.equal(config.source.accessToken, "db");
});

test("usa el token de entorno si no hay uno guardado", () => {
  const config = resolveMercadoPagoConfig({
    stored: {},
    envAccessToken: "TEST-env",
  });
  assert.equal(config.accessToken, "TEST-env");
  assert.equal(config.source.accessToken, "env");
  assert.equal(config.sandbox, true);
  assert.equal(config.source.sandbox, "token");
});

test("el modo sandbox guardado pisa el token TEST", () => {
  const config = resolveMercadoPagoConfig({
    stored: { accessToken: "TEST-123", sandbox: false },
    envSandbox: "true",
  });
  assert.equal(config.sandbox, false);
  assert.equal(config.source.sandbox, "db");
});

test("respeta MERCADOPAGO_SANDBOX=true si el modo es automático", () => {
  const config = resolveMercadoPagoConfig({
    stored: { accessToken: "APP_USR-prod" },
    envSandbox: "true",
  });
  assert.equal(config.sandbox, true);
  assert.equal(config.source.sandbox, "env");
});

test("mantiene el token previo si el formulario llega enmascarado", () => {
  const next = applyMercadoPagoFormUpdate(
    { accessToken: "enc:v1:keep-me" },
    {
      accessToken: "••••••••••••",
      publicKey: "APP_USR-pk",
      webhookSecret: "",
      sandboxMode: "auto",
      webhookStrict: false,
      clearAccessToken: false,
      clearWebhookSecret: false,
    },
  );
  assert.equal(next.accessToken, "enc:v1:keep-me");
  assert.equal(next.publicKey, "APP_USR-pk");
});

test("cifra un access token nuevo", () => {
  const next = applyMercadoPagoFormUpdate(
    {},
    {
      accessToken: "APP_USR-nuevo",
      publicKey: "",
      webhookSecret: "",
      sandboxMode: "on",
      webhookStrict: true,
      clearAccessToken: false,
      clearWebhookSecret: false,
    },
  );
  assert.ok(next.accessToken);
  assert.equal(isEncryptedSecret(next.accessToken), true);
  assert.equal(next.sandbox, true);
  assert.equal(next.webhookStrict, true);
});

test("puede borrar el token guardado", () => {
  const next = applyMercadoPagoFormUpdate(
    { accessToken: "enc:v1:old", webhookSecret: "enc:v1:sec" },
    {
      accessToken: "••••••••••••",
      publicKey: "",
      webhookSecret: "••••••••••••",
      sandboxMode: "off",
      webhookStrict: false,
      clearAccessToken: true,
      clearWebhookSecret: false,
    },
  );
  assert.equal(next.accessToken, undefined);
  assert.equal(next.webhookSecret, "enc:v1:sec");
  assert.equal(next.sandbox, false);
});

test("sandboxModeFromStored mapea null a automático", () => {
  assert.equal(sandboxModeFromStored(null), "auto");
  assert.equal(sandboxModeFromStored(true), "on");
  assert.equal(sandboxModeFromStored(false), "off");
});
