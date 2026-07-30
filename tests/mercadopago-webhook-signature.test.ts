import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  buildMercadoPagoManifest,
  extractMercadoPagoDataId,
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago/webhook-signature";

describe("mercadopago webhook signature", () => {
  it("parsea x-signature", () => {
    const parsed = parseMercadoPagoSignatureHeader(
      "ts=1704908010,v1=abc123def",
    );
    assert.deepEqual(parsed, { ts: "1704908010", v1: "abc123def" });
  });

  it("arma el manifest oficial", () => {
    const manifest = buildMercadoPagoManifest({
      dataId: "123456",
      requestId: "req-1",
      ts: "1704908010",
    });
    assert.equal(
      manifest,
      "id:123456;request-id:req-1;ts:1704908010;",
    );
  });

  it("pasa IDs alfanuméricos a lowercase", () => {
    const manifest = buildMercadoPagoManifest({
      dataId: "ORD01ABC",
      requestId: null,
      ts: "1704908010",
    });
    assert.equal(manifest, "id:ord01abc;ts:1704908010;");
  });

  it("acepta firma HMAC válida", () => {
    const secret = "test-secret";
    const dataId = "123456";
    const requestId = "req-1";
    const ts = String(Date.now());
    const manifest = buildMercadoPagoManifest({ dataId, requestId, ts });
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

    const result = verifyMercadoPagoWebhookSignature({
      secret,
      strict: true,
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mode, "verified");
    }
  });

  it("rechaza firma inválida", () => {
    const result = verifyMercadoPagoWebhookSignature({
      secret: "test-secret",
      strict: true,
      xSignature: `ts=${Date.now()},v1=deadbeef`,
      xRequestId: "req-1",
      dataId: "123",
    });
    assert.equal(result.ok, false);
  });

  it("en modo strict rechaza ausencia de firma", () => {
    const result = verifyMercadoPagoWebhookSignature({
      secret: "test-secret",
      strict: true,
      xSignature: null,
      xRequestId: null,
      dataId: "123",
    });
    assert.equal(result.ok, false);
  });

  it("sin strict permite unsigned", () => {
    const result = verifyMercadoPagoWebhookSignature({
      secret: "test-secret",
      strict: false,
      xSignature: null,
      xRequestId: null,
      dataId: "123",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mode, "skipped_unsigned");
    }
  });

  it("extrae data.id de query o body", () => {
    const url = new URL(
      "https://example.com/api/webhooks/mercadopago?data.id=999",
    );
    assert.equal(extractMercadoPagoDataId(url), "999");
    assert.equal(
      extractMercadoPagoDataId(new URL("https://example.com/hook"), {
        data: { id: 42 },
      }),
      "42",
    );
  });
});
