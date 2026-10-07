/**
 * Códigos de verificación genéricos (verification_codes) y plantillas de email nuevas.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma, type FakePrisma } from "./fake-prisma";
import {
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_RESEND_COOLDOWN_MS,
  VERIFICATION_CODE_TTL_MS,
  findPendingVerificationCode,
  issueVerificationCode,
  verifyVerificationCode,
} from "../src/lib/auth/verification-code";
import { confirmEmailVerification, sendEmailVerificationCode } from "../src/lib/auth/email-verification";
import { resolveMicrositeAccess } from "../src/lib/bodas/visibility";
import {
  emailButton,
  emailLogoUrl,
  escapeHtml,
  giftToCoupleEmail,
  layout,
  rsvpToCoupleEmail,
} from "../src/lib/email/templates";
import { registrationCodeEmail } from "../src/lib/email/verification-code-template";
import { passwordResetEmail } from "../src/lib/email/password-reset-template";
import { accountDeletionCodeEmail } from "../src/lib/email/account-deletion-template";

const db = (fake: FakePrisma) => fake as unknown as PrismaClient;
const SECRET = "test-secret-para-codigos-0123456789";
const T0 = new Date("2026-10-07T12:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const P = "email_verification" as const;

async function setup() {
  const fake = createFakePrisma();
  const user = await fake.user.create({ data: { email: "ana@example.com", passwordHash: "x", emailVerifiedAt: null } });
  const issued = await issueVerificationCode(db(fake), { userId: user.id, purpose: P, secret: SECRET, now: T0, code: "135790" });
  assert.equal(issued.ok, true);
  return { fake, user };
}

const noCheckout = {
  startPlanCheckout: async () => {
    throw new Error("no debería llamarse");
  },
};

describe("código de verificación de email", () => {
  it("guarda solo el hash, 15 minutos de vigencia", async () => {
    const { fake, user } = await setup();
    const [rec] = fake.tables.verificationCode;
    assert.equal(rec.purpose, P);
    assert.equal(String(rec.codeHash).length, 64);
    assert.equal(String(rec.codeHash).includes("135790"), false);
    assert.equal((rec.expiresAt as Date).getTime() - T0.getTime(), VERIFICATION_CODE_TTL_MS);
    const pending = await findPendingVerificationCode(db(fake), { userId: user.id, purpose: P, now: at(1000) });
    assert.equal(pending?.resendAvailableAt.getTime(), T0.getTime() + VERIFICATION_CODE_RESEND_COOLDOWN_MS);
    assert.equal(await findPendingVerificationCode(db(fake), { userId: user.id, purpose: P, now: at(VERIFICATION_CODE_TTL_MS) }), null);
  });

  it("código incorrecto: no verifica y descuenta intentos", async () => {
    const { fake, user } = await setup();
    const r = await confirmEmailVerification(db(fake), { userId: user.id, code: "000000", secret: SECRET, now: at(1000) }, noCheckout);
    assert.deepEqual(r, { ok: false, error: "invalid", attemptsLeft: VERIFICATION_CODE_MAX_ATTEMPTS - 1 });
    assert.equal(fake.tables.user[0].emailVerifiedAt, null);
  });

  it("código vencido: no verifica", async () => {
    const { fake, user } = await setup();
    const r = await confirmEmailVerification(db(fake), { userId: user.id, code: "135790", secret: SECRET, now: at(VERIFICATION_CODE_TTL_MS + 1) }, noCheckout);
    assert.equal(r.ok ? "ok" : r.error, "expired");
    assert.equal(fake.tables.user[0].emailVerifiedAt, null);
  });

  it("máximo de intentos: después ni el código correcto sirve", async () => {
    const { fake, user } = await setup();
    for (let i = 0; i < VERIFICATION_CODE_MAX_ATTEMPTS - 1; i++) {
      const r = await verifyVerificationCode(db(fake), { userId: user.id, purpose: P, code: "111111", secret: SECRET, now: at(1000) });
      assert.equal(r.ok ? "ok" : r.error, "invalid");
    }
    const last = await verifyVerificationCode(db(fake), { userId: user.id, purpose: P, code: "111111", secret: SECRET, now: at(1000) });
    assert.deepEqual(last, { ok: false, error: "too_many", attemptsLeft: 0 });
    const r = await confirmEmailVerification(db(fake), { userId: user.id, code: "135790", secret: SECRET, now: at(2000) }, noCheckout);
    assert.equal(r.ok ? "ok" : r.error, "too_many");
    assert.equal(fake.tables.user[0].emailVerifiedAt, null);
  });

  it("código correcto: verifica una sola vez", async () => {
    const { fake, user } = await setup();
    const r = await confirmEmailVerification(db(fake), { userId: user.id, code: "135 790", secret: SECRET, now: at(5000) }, noCheckout);
    assert.deepEqual(r, { ok: true, redirectTo: "/mi-cuenta", plan: null });
    assert.deepEqual(fake.tables.user[0].emailVerifiedAt, at(5000));
    assert.equal(fake.tables.verificationCode.length, 0);
    const again = await verifyVerificationCode(db(fake), { userId: user.id, purpose: P, code: "135790", secret: SECRET, now: at(6000) });
    assert.equal(again.ok ? "ok" : again.error, "missing");
  });

  it("reenvío: cooldown de 60 s y el código nuevo invalida el anterior", async () => {
    const { fake, user } = await setup();
    const sent: string[] = [];
    const deps = { enqueue: async (m: { html: string }) => (sent.push(m.html), { skipped: false }) };
    const early = await sendEmailVerificationCode(db(fake), { userId: user.id, email: user.email, locale: "es", secret: SECRET, now: at(30_000), code: "222222" }, deps);
    assert.deepEqual(early, { ok: false, error: "cooldown", retryAfterSec: 30 });
    assert.equal(sent.length, 0);

    const later = await sendEmailVerificationCode(db(fake), { userId: user.id, email: user.email, locale: "es", secret: SECRET, now: at(VERIFICATION_CODE_RESEND_COOLDOWN_MS), code: "333333" }, deps);
    assert.equal(later.ok, true);
    assert.equal(sent.length, 1);
    assert.match(sent[0], /333333/);
    const old = await verifyVerificationCode(db(fake), { userId: user.id, purpose: P, code: "135790", secret: SECRET, now: at(61_000) });
    assert.equal(old.ok ? "ok" : old.error, "invalid");
    const fresh = await verifyVerificationCode(db(fake), { userId: user.id, purpose: P, code: "333333", secret: SECRET, now: at(62_000) });
    assert.equal(fresh.ok, true);
  });

  it("los propósitos no se mezclan: un código de verificación no sirve para borrar la cuenta", async () => {
    const { fake, user } = await setup();
    const r = await verifyVerificationCode(db(fake), { userId: user.id, purpose: "account_deletion", code: "135790", secret: SECRET, now: at(1000) });
    assert.equal(r.ok ? "ok" : r.error, "missing");
    await issueVerificationCode(db(fake), { userId: user.id, purpose: "account_deletion", secret: SECRET, now: T0, code: "135790" });
    assert.equal(fake.tables.verificationCode.length, 2);
  });

  it("micrositio de un registro sin verificar: offline para el público, vista previa para el dueño", () => {
    const base = { ownerStatus: "active", isOnline: true, ownerId: "u1" };
    assert.equal(resolveMicrositeAccess({ ...base, ownerEmailVerified: false, viewer: null }), "hidden");
    assert.equal(resolveMicrositeAccess({ ...base, ownerEmailVerified: false, viewer: { userId: "u1", isAdmin: false } }), "preview");
    assert.equal(resolveMicrositeAccess({ ...base, ownerEmailVerified: true, viewer: null }), "public");
    assert.equal(resolveMicrositeAccess({ ...base, viewer: null }), "public");
  });
});

describe("plantillas de email (base nueva)", () => {
  it("layout: logo con URL absoluta desde NEXT_PUBLIC_APP_URL, footer y misma firma", () => {
    const prevApp = process.env.NEXT_PUBLIC_APP_URL;
    const prevAssets = process.env.EMAIL_ASSETS_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://twww.debodas.com.ar/";
    delete process.env.EMAIL_ASSETS_URL;
    try {
      assert.equal(emailLogoUrl(), "https://twww.debodas.com.ar/assets/img/email/logo-debodas-email.png");
      const html = layout("Título <x>", "<p>Hola</p>");
      assert.match(html, /src="https:\/\/twww\.debodas\.com\.ar\/assets\/img\/email\/logo-debodas-email\.png"/);
      assert.match(html, /Título &lt;x&gt;/);
      assert.match(html, /© \d{4} DeBodas, un servicio de Applica · Argentina/);
      assert.match(html, /Equipo DeBodas/);
      assert.match(html, /<html lang="es"/);
    } finally {
      if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevApp;
      if (prevAssets !== undefined) process.env.EMAIL_ASSETS_URL = prevAssets;
    }
  });

  it("emails existentes adoptan la base sin cambios y siguen escapando", () => {
    const rsvp = rsvpToCoupleEmail({
      coupleName: "Ana & Luis",
      guestName: "<script>alert(1)</script>",
      status: "confirmed",
      invitadosUrl: "https://debodas.com.ar/mi-cuenta/invitados",
    });
    assert.match(rsvp.html, /logo-debodas-email\.png/);
    assert.equal(rsvp.html.includes("<script>alert(1)</script>"), false);
    assert.match(rsvp.html, /&lt;script&gt;/);
    assert.equal(/style="color:#e6dac7/i.test(rsvp.html), false, "links de bajo contraste reemplazados");
    assert.match(rsvp.html, /Ver invitados<\/a>/);
    const gift = giftToCoupleEmail({ coupleName: "A", participants: "B", amountLabel: "$1", methodLabel: "MP", pending: true, itemsSummary: "x", panelUrl: "https://x" });
    assert.match(gift.html, /Regalo pendiente/);
  });

  for (const locale of ["es", "en", "pt"] as const) {
    it(`verificación de registro (${locale}): código en el cuerpo, no en el asunto, escapa el nombre`, () => {
      const mail = registrationCodeEmail({ locale, code: "482913", minutes: 15, name: "<b>Sofía</b>" });
      assert.equal(mail.subject.includes("482913"), false);
      assert.match(mail.subject, /DeBodas/);
      assert.match(mail.html, /482913/);
      assert.match(mail.html, new RegExp(`<html lang="${locale}"`));
      assert.equal(mail.html.includes("<b>Sofía</b>"), false);
      assert.match(mail.html, /&lt;b&gt;Sofía&lt;\/b&gt;/);
      assert.match(mail.html, /15/);
    });

    it(`restablecer contraseña (${locale}): botón + enlace de respaldo, escapado`, () => {
      const url = "https://debodas.com.ar/recuperar/abc?x=1&y=\"2\"";
      const mail = passwordResetEmail({ locale, resetUrl: url, name: "<i>Ana</i>", minutes: 60 });
      assert.match(mail.subject, /DeBodas/);
      const escaped = escapeHtml(url);
      assert.ok(mail.html.split(`href="${escaped}"`).length - 1 >= 2, "botón y enlace de respaldo");
      assert.match(mail.html, /v:roundrect/);
      assert.equal(mail.html.includes("<i>Ana</i>"), false);
      assert.match(mail.html, new RegExp(`<html lang="${locale}"`));
    });

    it(`borrado de cuenta (${locale}): tono danger y claves nuevas traducidas`, () => {
      const mail = accountDeletionCodeEmail({ locale, code: "305718", minutes: 15 });
      assert.match(mail.html, /305718/);
      assert.match(mail.subject, /DeBodas/);
      assert.equal(/accountDeletion\./.test(mail.html), false, "sin claves i18n sin traducir");
    });
  }

  it("el texto de respaldo del botón sigue el idioma", () => {
    assert.match(emailButton({ label: "Go", href: "https://x", lang: "en" }), /Button not working\?/);
    assert.match(emailButton({ label: "Ir", href: "https://x" }), /¿El botón no funciona\?/);
  });
});
