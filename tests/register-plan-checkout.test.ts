/**
 * Registro -> código de verificación por email -> (plan pago) checkout de MercadoPago.
 * La boda nace en "free"; MercadoPago se abre recién al verificar el email.
 * Usa el Prisma en memoria (tests/fake-prisma.ts) y mocks para sesión, cola de emails
 * y preferencia de MercadoPago: no hace falta MariaDB ni red.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma, type FakePrisma } from "./fake-prisma";
import type { RegisterInput } from "../src/lib/auth/register";
import {
  PENDING_SIGNUP_PLAN_KEY,
  REGISTER_CHECKOUT_ERROR_REDIRECT,
  REGISTER_HOME_REDIRECT,
  VERIFY_EMAIL_PATH,
  registerAccount,
  resolvePaidSignupPlan,
  type RegisterAccountDeps,
} from "../src/lib/auth/register-account";
import {
  confirmEmailVerification,
  isEmailVerified,
  sendEmailVerificationCode,
  type ConfirmEmailVerificationDeps,
} from "../src/lib/auth/email-verification";

const MP_URL = "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123-abc";
const SECRET = "test-secret-para-codigos-0123456789";
const CODE = "246810";

function input(overrides: Partial<RegisterInput> = {}): RegisterInput {
  return {
    email: "ana@example.com",
    password: "secreto123",
    passwordConfirm: "secreto123",
    brideName: "Ana",
    brideLastname: "Pérez",
    groomName: "Luis",
    groomLastname: "Gómez",
    phone: "1155554444",
    eventDate: "2027-03-20",
    ourStory: "",
    siteSource: "search",
    siteSourceOther: "",
    selectedPlan: "gratuito",
    ...overrides,
  };
}

interface SentEmail {
  to: string;
  subject: string;
  html: string;
  type: string;
}

interface Harness {
  db: FakePrisma;
  deps: RegisterAccountDeps;
  confirmDeps: ConfirmEmailVerificationDeps;
  sessions: Array<{ userId: string; email: string }>;
  checkouts: Array<{ bodaId: string; email: string; plan: string }>;
  emails: SentEmail[];
  errors: string[];
}

function harness(
  checkout: ConfirmEmailVerificationDeps["startPlanCheckout"] = async () => ({ initPoint: MP_URL }),
  opts: { failEmail?: boolean } = {},
): Harness {
  const db = createFakePrisma();
  const h: Harness = {
    db,
    sessions: [],
    checkouts: [],
    emails: [],
    errors: [],
    deps: undefined as never,
    confirmDeps: undefined as never,
  };
  const prisma = db as unknown as PrismaClient;
  h.deps = {
    db: prisma,
    hashPassword: async (password) => `hashed:${password}`,
    generateSlug: async (bride, groom) => `${bride}-${groom}`.toLowerCase(),
    saveBanner: async () => "/uploads/banner.jpg",
    describeUploadError: () => "upload error",
    createSession: async (user) => {
      h.sessions.push({ userId: user.userId, email: user.email });
    },
    sendVerificationCode: (user) =>
      sendEmailVerificationCode(
        prisma,
        { ...user, locale: "es", secret: SECRET, code: CODE },
        {
          enqueue: async (mail) => {
            if (opts.failEmail) throw new Error("SMTP caído");
            h.emails.push(mail);
            return { skipped: false };
          },
          logError: (scope) => h.errors.push(scope),
        },
      ),
    logError: (scope) => {
      h.errors.push(scope);
    },
  };
  h.confirmDeps = {
    startPlanCheckout: async (args) => {
      h.checkouts.push(args);
      return checkout(args);
    },
    logError: (scope) => {
      h.errors.push(scope);
    },
  };
  return h;
}

const userRow = (h: Harness) => h.db.tables.user[0];
const verify = (h: Harness, code = CODE) =>
  confirmEmailVerification(
    h.db as unknown as PrismaClient,
    { userId: userRow(h).id as string, code, secret: SECRET },
    h.confirmDeps,
  );

describe("resolvePaidSignupPlan", () => {
  it("solo basico y premium son planes pagos", () => {
    assert.equal(resolvePaidSignupPlan("gratuito"), null);
    assert.equal(resolvePaidSignupPlan("basico"), "basico");
    assert.equal(resolvePaidSignupPlan("premium"), "premium");
    assert.equal(resolvePaidSignupPlan("otro"), null);
  });
});

describe("registerAccount + verificación de email", () => {
  it("registro: crea la cuenta sin verificar, manda el código y va a la pantalla del código", async () => {
    const h = harness();
    const result = await registerAccount(input({ selectedPlan: "basico" }), null, h.deps);

    assert.deepEqual(result, { success: true, redirectTo: VERIFY_EMAIL_PATH });
    assert.equal(VERIFY_EMAIL_PATH, "/registro/verificar");
    const user = userRow(h);
    // null explícito (no el default now() de la columna, que el fake también aplica si se omite).
    assert.strictEqual(user.emailVerifiedAt, null);
    assert.equal("emailVerifiedAt" in user, true);
    assert.equal(isEmailVerified(user as { emailVerifiedAt: Date | null }), false);
    assert.equal(h.sessions.length, 1);
    const [boda] = h.db.tables.boda;
    assert.equal(boda.plan, "free");
    assert.equal((boda.misc as Record<string, unknown>)[PENDING_SIGNUP_PLAN_KEY], "basico");

    // Email con el código (plantilla nueva, código fuera del asunto) y solo el hash en la base.
    assert.equal(h.emails.length, 1);
    assert.equal(h.emails[0].to, "ana@example.com");
    assert.equal(h.emails[0].type, "email_verification_code");
    assert.equal(h.emails[0].subject, "Confirmá tu email en DeBodas");
    assert.equal(h.emails[0].subject.includes(CODE), false);
    assert.match(h.emails[0].html, new RegExp(CODE));
    const [code] = h.db.tables.verificationCode;
    assert.equal(code.purpose, "email_verification");
    assert.equal(String(code.codeHash).includes(CODE), false);

    // MercadoPago NO se abre antes de verificar.
    assert.equal(h.checkouts.length, 0);
    assert.deepEqual(h.errors, []);
  });

  it("plan pago: con código incorrecto no hay checkout; con el correcto verifica y abre MercadoPago", async () => {
    const h = harness();
    await registerAccount(input({ selectedPlan: "premium" }), null, h.deps);

    const wrong = await verify(h, "000000");
    assert.equal(wrong.ok, false);
    assert.equal(h.checkouts.length, 0);
    assert.equal(userRow(h).emailVerifiedAt, null);

    const ok = await verify(h);
    assert.deepEqual(ok, { ok: true, redirectTo: MP_URL, plan: "premium" });
    assert.ok(userRow(h).emailVerifiedAt instanceof Date);
    const [boda] = h.db.tables.boda;
    assert.deepEqual(h.checkouts, [{ bodaId: boda.id, email: "ana@example.com", plan: "premium" }]);
    assert.equal(boda.plan, "free", "el plan se activa recién con el pago aprobado");
    assert.equal(PENDING_SIGNUP_PLAN_KEY in (boda.misc as Record<string, unknown>), false);

    // Un solo uso.
    const again = await verify(h);
    assert.equal(again.ok ? "ok" : again.error, "missing");
    assert.equal(h.checkouts.length, 1);
  });

  it("gratuito: al verificar va a /mi-cuenta sin crear preferencia", async () => {
    const h = harness();
    await registerAccount(input({ selectedPlan: "gratuito" }), null, h.deps);
    const ok = await verify(h);
    assert.deepEqual(ok, { ok: true, redirectTo: REGISTER_HOME_REDIRECT, plan: null });
    assert.equal(REGISTER_HOME_REDIRECT, "/mi-cuenta");
    assert.equal(h.checkouts.length, 0);
  });

  it("si MercadoPago falla al verificar, queda verificado y va a /mi-cuenta/plan?checkout=error", async () => {
    const h = harness(async () => {
      throw new Error("MercadoPago no está configurado.");
    });
    await registerAccount(input({ selectedPlan: "premium" }), null, h.deps);
    const ok = await verify(h);

    assert.deepEqual(ok, { ok: true, redirectTo: REGISTER_CHECKOUT_ERROR_REDIRECT, plan: "premium" });
    assert.equal(REGISTER_CHECKOUT_ERROR_REDIRECT, "/mi-cuenta/plan?checkout=error");
    assert.ok(userRow(h).emailVerifiedAt instanceof Date);
    assert.deepEqual(h.errors, ["[email verification] checkout"]);
  });

  it("si el checkout no devuelve URL, también cae en checkout=error", async () => {
    const h = harness(async () => ({ initPoint: "" }));
    await registerAccount(input({ selectedPlan: "basico" }), null, h.deps);
    const ok = await verify(h);
    assert.equal(ok.ok && ok.redirectTo, REGISTER_CHECKOUT_ERROR_REDIRECT);
  });

  it("si el email del código no sale, la cuenta igual se crea (se reenvía desde la pantalla)", async () => {
    const h = harness(undefined, { failEmail: true });
    const result = await registerAccount(input({ selectedPlan: "basico" }), null, h.deps);
    assert.deepEqual(result, { success: true, redirectTo: VERIFY_EMAIL_PATH });
    assert.equal(h.db.tables.user.length, 1);
    assert.equal(h.db.tables.verificationCode.length, 0, "sin email se descarta el código (sin cooldown)");
    assert.deepEqual(h.errors, ["[email verification] no se pudo encolar el código"]);
  });

  it("email repetido: devuelve error, no manda código ni inicia checkout", async () => {
    const h = harness();
    await h.db.user.create({ data: { email: "ana@example.com", passwordHash: "x" } });
    const result = await registerAccount(input({ selectedPlan: "basico" }), null, h.deps);

    assert.deepEqual(result, { error: "Ya existe una cuenta con ese email." });
    assert.equal(h.emails.length, 0);
    assert.equal(h.checkouts.length, 0);
    assert.equal(h.sessions.length, 0);
  });

  it("usuarios creados por otras vías (WP, scripts) quedan verificados por el default now()", async () => {
    const h = harness();
    const before = Date.now();
    const u = await h.db.user.create({ data: { email: "wp@example.com", passwordHash: "x", migratedFromWp: true } });
    assert.ok(u.emailVerifiedAt instanceof Date, "el fake aplica @default(now()) cuando se omite");
    assert.ok((u.emailVerifiedAt as Date).getTime() >= before);
    assert.equal(isEmailVerified(u), true);
    // y un null explícito se respeta (es lo que hace registerAccount)
    const pending = await h.db.user.create({ data: { email: "p@example.com", passwordHash: "x", emailVerifiedAt: null } });
    assert.strictEqual(pending.emailVerifiedAt, null);
  });
});
