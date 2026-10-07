/**
 * Borrado definitivo por la pareja (derecho al olvido) + código de verificación por email.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hash } from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma, type FakePrisma } from "./fake-prisma";
import { eraseAccount, isEraseableUploadUrl } from "../src/lib/account/delete-account";
import {
  DELETION_CODE_MAX_ATTEMPTS,
  DELETION_CODE_RESEND_COOLDOWN_MS,
  DELETION_CODE_TTL_MS,
  confirmAccountDeletion,
  issueDeletionCode,
  verifyDeletionCode,
} from "../src/lib/account/deletion-code";
import { changeAccountStatus } from "../src/lib/account/admin-status";
import { erasedEmailFor, erasedSlugFor, loginOutcomeForStatus } from "../src/lib/account/status";
import { checkUserPassword } from "../src/lib/auth/legacy-password";
import { accountDeletionCodeEmail } from "../src/lib/email/account-deletion-template";
import { resolveDeletableUploadFolder } from "../src/lib/upload/local";
import { rowsToMeta } from "../src/lib/wp-import/acf";
import { DeletedAccountImportError, isWpUserTombstoned, persistWpBoda } from "../src/lib/wp-import/persist";

const db = (fake: FakePrisma) => fake as unknown as PrismaClient;
const SECRET = "test-secret-para-codigos-0123456789";
const EMAIL = "ana.perez@example.com";
const PII = [EMAIL, "Ana Pérez", "Tío Carlos", "tio.carlos@example.com", "Tía Marta", "marta@example.com", "+54 11 5555-0000", "Felicidades chicos", "APP_USR-secreto", "ana-y-juan"];

async function seedFullAccount(fake: FakePrisma) {
  const user = await fake.user.create({
    data: {
      email: EMAIL,
      name: "Ana Pérez",
      passwordHash: await hash("clave-actual", 4),
      legacyPasswordHash: "$P$Bviejo",
      legacyWpUserId: 7,
      migratedFromWp: true,
    },
  });
  const boda = await fake.boda.create({
    data: {
      userId: user.id,
      slug: "ana-y-juan",
      title: "Boda de Ana Pérez",
      isOnline: true,
      couple: { bride_name: "Ana Pérez", groom_name: "Juan" },
      event: { place: "Salón" },
      banner: { image: { url: "/uploads/bodas/ana-y-juan/banner.jpg" } },
      options: { gallery: ["/uploads/migrated/media/compartida.jpg", "/uploads/bodas/ana-y-juan/g1.webp"], is_online: 1 },
      misc: { wp_post_id: 101, mp_access_token: "APP_USR-secreto" },
      featuredImageUrl: "/uploads/bodas/ana-y-juan/cover.jpg",
    },
  });
  await fake.gift.create({ data: { bodaId: boda.id, title: "Licuadora", price: 10, quantity: 1, sortOrder: 0, imageUrl: "/uploads/bodas/ana-y-juan/gift.png" } });
  await fake.picture.create({ data: { bodaId: boda.id, url: "/uploads/bodas/ana-y-juan/p1.jpg", sortOrder: 0 } });
  await fake.scheduleItem.create({ data: { bodaId: boda.id, title: "Ceremonia" } });
  await fake.faqItem.create({ data: { bodaId: boda.id, question: "¿Hay estacionamiento?", answer: "Sí" } });
  await fake.rsvpGuest.create({ data: { bodaId: boda.id, name: "Tío Carlos", email: "tio.carlos@example.com" } });
  await fake.notification.create({ data: { bodaId: boda.id, title: "Tío Carlos confirmó" } });
  await fake.rating.create({ data: { bodaId: boda.id, email: EMAIL, stars: 5 } });
  await fake.passwordResetToken.create({ data: { userId: user.id, tokenHash: "abc", expiresAt: new Date(Date.now() + 1e6) } });
  const payment = await fake.payment.create({
    data: { bodaId: boda.id, type: "plan", amount: 10000, status: "approved", payerEmail: EMAIL, metadata: { plan: "premium", user_email: EMAIL } },
  });
  await fake.confirmedGift.create({
    data: {
      bodaId: boda.id,
      paymentId: payment.id,
      participants: "Tía Marta",
      email: "marta@example.com",
      phone: "+54 11 5555-0000",
      dedication: "Felicidades chicos",
      method: "transfer",
      amount: 5000,
      voucherUrl: "/uploads/bodas/ana-y-juan/vouchers/v.jpg",
    },
  });
  await fake.emailLog.create({ data: { toAddress: EMAIL, subject: "Bienvenida Ana Pérez", contentEncrypted: "enc", replyTo: null } });
  await fake.emailLog.create({ data: { toAddress: "otra@example.com", subject: "Otro", replyTo: EMAIL } });
  await fake.legacyMap.create({ data: { kind: "user", wpId: 7, prismaId: user.id } });
  await fake.legacyMap.create({ data: { kind: "boda", wpId: 101, prismaId: boda.id } });
  return { user, boda, payment };
}

function spyDeps() {
  const files: string[] = [];
  const folders: string[] = [];
  return {
    files,
    folders,
    deps: {
      deleteFile: async (url: string) => {
        files.push(url);
      },
      deleteFolder: async (subdir: string) => {
        folders.push(subdir);
      },
      logError: () => {},
    },
  };
}

describe("borrado definitivo (eraseAccount)", () => {
  it("borra/anonimiza PII, conserva pagos y montos, borra archivos de la boda", async () => {
    const fake = createFakePrisma();
    const { user, boda } = await seedFullAccount(fake);
    const spy = spyDeps();

    const r = await eraseAccount(db(fake), { userId: user.id }, spy.deps);
    assert.equal(r.ok, true);
    assert.equal(r.bodaId, boda.id);

    // Ningún dato personal queda en ninguna tabla.
    const dump = JSON.stringify(fake.tables);
    for (const value of PII) {
      assert.equal(dump.includes(value), false, `quedó PII: ${value}`);
    }

    const u = fake.tables.user[0];
    assert.equal(u.status, "deleted");
    assert.ok(u.erasedAt instanceof Date && u.deletedAt instanceof Date);
    assert.equal(u.email, erasedEmailFor(user.id));
    assert.equal(u.name, null);
    assert.equal(u.legacyPasswordHash, null);
    assert.equal(u.legacyWpUserId, 7, "tombstone para WP");
    assert.equal(u.sessionVersion, 1);
    assert.equal(loginOutcomeForStatus(u.status as string), "invalid");
    assert.equal((await checkUserPassword(db(fake), u as never, "clave-actual")).ok, false);

    const b = fake.tables.boda[0];
    assert.equal(b.slug, erasedSlugFor(boda.id));
    assert.equal(b.isOnline, false);
    assert.deepEqual(b.couple, {});
    assert.deepEqual(b.misc, { wp_post_id: 101 });

    for (const model of ["gift", "picture", "scheduleItem", "faqItem", "rsvpGuest", "notification", "rating", "passwordResetToken"]) {
      assert.equal(fake.tables[model].length, 0, model);
    }

    // Pagos: se conservan montos/estado, sin email.
    assert.equal(fake.tables.payment.length, 1);
    const p = fake.tables.payment[0];
    assert.equal(p.amount, 10000);
    assert.equal(p.status, "approved");
    assert.equal(p.payerEmail, null);
    assert.deepEqual(p.metadata, { plan: "premium" });
    const cg = fake.tables.confirmedGift[0];
    assert.equal(cg.amount, 5000);
    assert.equal(cg.method, "transfer");
    assert.equal(cg.participants, "");
    assert.equal(cg.voucherUrl, null);

    // EmailLog
    const [mine, other] = fake.tables.emailLog;
    assert.equal(mine.toAddress, erasedEmailFor(user.id));
    assert.equal(mine.contentEncrypted, null);
    assert.equal(other.replyTo, null);

    // Archivos: los de la boda sí, la media compartida migrada nunca.
    assert.deepEqual(
      [...spy.files].sort(),
      [
        "/uploads/bodas/ana-y-juan/banner.jpg",
        "/uploads/bodas/ana-y-juan/cover.jpg",
        "/uploads/bodas/ana-y-juan/g1.webp",
        "/uploads/bodas/ana-y-juan/gift.png",
        "/uploads/bodas/ana-y-juan/p1.jpg",
        "/uploads/bodas/ana-y-juan/vouchers/v.jpg",
      ],
    );
    assert.deepEqual(spy.folders, ["bodas/ana-y-juan"]);
    assert.equal(r.filesRequested, 6);

    const audit = fake.tables.adminAuditLog.at(-1)!;
    assert.equal(audit.action, "account.self_deleted");

    // No se puede borrar dos veces ni restaurar desde el admin.
    assert.deepEqual(await eraseAccount(db(fake), { userId: user.id }, spy.deps), { ok: false, error: "already_erased" });
    const admin = await fake.user.create({ data: { email: "admin@example.com", passwordHash: "x", role: "admin" } });
    const restore = await changeAccountStatus(db(fake), {
      actorId: admin.id,
      audit: { actorUserId: admin.id, actorEmail: "admin@example.com", ipHash: null },
      userId: user.id,
      op: "restore",
    });
    assert.deepEqual(restore, { ok: false, error: "erased" });
  });

  it("WP: la cuenta borrada no se reimporta (ni la boda vieja ni una nueva del mismo usuario)", async () => {
    const fake = createFakePrisma();
    const { user } = await seedFullAccount(fake);
    await eraseAccount(db(fake), { userId: user.id }, spyDeps().deps);

    assert.equal(await isWpUserTombstoned(db(fake), { wpUserId: 7 }), true);
    const ctx = { db: db(fake), mode: "overwrite" as const, dryRun: false, runId: "t", usedEmails: new Set<string>() };
    const meta = rowsToMeta([{ meta_key: "couple_bride_name", meta_value: "Ana Pérez" }]);
    const wpUser = { ID: 7, user_email: EMAIL, display_name: "Ana Pérez", user_pass: "$P$Bx", user_registered: new Date() };
    const boda = (id: number) => ({ ID: id, post_title: "Boda", post_name: "ana-y-juan", post_author: 7, post_date: new Date(), post_modified: new Date() });

    const same = await persistWpBoda({ boda: boda(101), meta, user: wpUser, attachments: new Map() }, ctx);
    assert.equal(same.action, "skipped");
    assert.equal(same.reason, "account_deleted");
    await assert.rejects(persistWpBoda({ boda: boda(202), meta, user: wpUser, attachments: new Map() }, ctx), DeletedAccountImportError);
    assert.equal(fake.tables.user.length, 1);
    assert.equal(fake.tables.boda.length, 1);
    assert.equal(JSON.stringify(fake.tables).includes(EMAIL), false);
  });

  it("si falla un archivo, el borrado en base igual queda hecho", async () => {
    const fake = createFakePrisma();
    const { user } = await seedFullAccount(fake);
    const errors: string[] = [];
    const r = await eraseAccount(db(fake), { userId: user.id }, {
      deleteFile: async () => {
        throw new Error("disco");
      },
      deleteFolder: async () => {},
      logError: (scope) => errors.push(scope),
    });
    assert.equal(r.ok, true);
    assert.equal(fake.tables.user[0].status, "deleted");
    assert.equal(errors.length, 6);
  });

  it("solo borra uploads propios y carpetas bodas/<slug>", () => {
    assert.equal(isEraseableUploadUrl("/uploads/bodas/x/a.jpg"), true);
    assert.equal(isEraseableUploadUrl("/uploads/migrated/media/a.jpg"), false);
    assert.equal(isEraseableUploadUrl("https://otro.com/a.jpg"), false);
    assert.equal(resolveDeletableUploadFolder("bodas/ana-y-juan"), "bodas/ana-y-juan");
    assert.equal(resolveDeletableUploadFolder("bodas"), null);
    assert.equal(resolveDeletableUploadFolder(""), null);
    assert.equal(resolveDeletableUploadFolder("migrated/media"), null);
    assert.equal(resolveDeletableUploadFolder("bodas/migrated"), null);
    assert.equal(resolveDeletableUploadFolder("../bodas/x"), null);
    assert.equal(resolveDeletableUploadFolder("bodas/../../etc"), null);
  });
});

describe("código de verificación para borrar la cuenta", () => {
  const T0 = new Date("2026-10-07T12:00:00Z");
  const at = (ms: number) => new Date(T0.getTime() + ms);

  async function setup() {
    const fake = createFakePrisma();
    const { user } = await seedFullAccount(fake);
    const issued = await issueDeletionCode(db(fake), { userId: user.id, secret: SECRET, now: T0, code: "123456" });
    assert.equal(issued.ok, true);
    let erased = 0;
    const erase = async (userId: string) => {
      erased++;
      return eraseAccount(db(fake), { userId }, spyDeps().deps);
    };
    return { fake, user, erase, erasedCount: () => erased };
  }

  it("solo se guarda el hash, con vencimiento de 15 minutos", async () => {
    const { fake } = await setup();
    const [rec] = fake.tables.verificationCode;
    assert.equal(rec.purpose, "account_deletion");
    assert.equal(String(rec.codeHash).includes("123456"), false);
    assert.equal(String(rec.codeHash).length, 64);
    assert.equal((rec.expiresAt as Date).getTime() - T0.getTime(), DELETION_CODE_TTL_MS);
    assert.equal(rec.attempts, 0);
  });

  it("código incorrecto: no borra y descuenta intentos", async () => {
    const { fake, user, erase, erasedCount } = await setup();
    const r = await confirmAccountDeletion(db(fake), { userId: user.id, code: "000000", secret: SECRET, now: at(1000) }, erase);
    assert.deepEqual(r, { ok: false, error: "invalid", attemptsLeft: DELETION_CODE_MAX_ATTEMPTS - 1 });
    assert.equal(erasedCount(), 0);
    assert.equal(fake.tables.user[0].email, EMAIL);
    const fmt = await verifyDeletionCode(db(fake), { userId: user.id, code: "12", secret: SECRET, now: at(1000) });
    assert.equal(fmt.ok ? "ok" : fmt.error, "format");
  });

  it("código vencido: no borra", async () => {
    const { fake, user, erase, erasedCount } = await setup();
    const r = await confirmAccountDeletion(db(fake), { userId: user.id, code: "123456", secret: SECRET, now: at(DELETION_CODE_TTL_MS + 1) }, erase);
    assert.equal(r.ok ? "ok" : r.error, "expired");
    assert.equal(erasedCount(), 0);
  });

  it("demasiados intentos: el código queda inutilizable aunque después se acierte", async () => {
    const { fake, user, erase, erasedCount } = await setup();
    let last;
    for (let i = 0; i < DELETION_CODE_MAX_ATTEMPTS; i++) {
      last = await verifyDeletionCode(db(fake), { userId: user.id, code: "999999", secret: SECRET, now: at(1000) });
    }
    assert.deepEqual(last, { ok: false, error: "too_many", attemptsLeft: 0 });
    const r = await confirmAccountDeletion(db(fake), { userId: user.id, code: "123456", secret: SECRET, now: at(2000) }, erase);
    assert.equal(r.ok ? "ok" : r.error, "too_many");
    assert.equal(erasedCount(), 0);
  });

  it("código correcto y vigente: borra la cuenta; es de un solo uso", async () => {
    const { fake, user, erase, erasedCount } = await setup();
    const r = await confirmAccountDeletion(db(fake), { userId: user.id, code: " 123 456 ", secret: SECRET, now: at(60_000) }, erase);
    assert.equal(r.ok, true);
    assert.equal(erasedCount(), 1);
    assert.equal(fake.tables.user[0].status, "deleted");
    assert.equal(fake.tables.verificationCode.length, 0);
    const again = await confirmAccountDeletion(db(fake), { userId: user.id, code: "123456", secret: SECRET, now: at(61_000) }, erase);
    assert.equal(again.ok ? "ok" : again.error, "missing");
    assert.equal(erasedCount(), 1);
  });

  it("reenvío: respeta el cooldown y el código nuevo reemplaza al anterior", async () => {
    const { fake, user, erase, erasedCount } = await setup();
    const early = await issueDeletionCode(db(fake), { userId: user.id, secret: SECRET, now: at(10_000), code: "222222" });
    assert.equal(early.ok, false);
    assert.equal(!early.ok && early.retryAfterSec, 50);

    const later = await issueDeletionCode(db(fake), { userId: user.id, secret: SECRET, now: at(DELETION_CODE_RESEND_COOLDOWN_MS + 1), code: "333333" });
    assert.equal(later.ok, true);
    assert.equal(fake.tables.verificationCode.length, 1);
    const old = await confirmAccountDeletion(db(fake), { userId: user.id, code: "123456", secret: SECRET, now: at(70_000) }, erase);
    assert.equal(old.ok ? "ok" : old.error, "invalid");
    const fresh = await confirmAccountDeletion(db(fake), { userId: user.id, code: "333333", secret: SECRET, now: at(71_000) }, erase);
    assert.equal(fresh.ok, true);
    assert.equal(erasedCount(), 1);
  });

  it("otro secreto u otro usuario no validan el código", async () => {
    const { fake, user } = await setup();
    const r = await verifyDeletionCode(db(fake), { userId: user.id, code: "123456", secret: "otro-secreto-distinto-123", now: at(1000) });
    assert.equal(r.ok ? "ok" : r.error, "invalid");
  });

  it("email del código: i18n, layout común y sin HTML inyectable", () => {
    const es = accountDeletionCodeEmail({ locale: "es", code: "123456", minutes: 15 });
    assert.equal(es.subject, "Código para eliminar tu cuenta de DeBodas");
    assert.match(es.html, /<html lang="es"/);
    assert.match(es.html, /123456/);
    assert.match(es.html, /15 minutos/);
    const en = accountDeletionCodeEmail({ locale: "en", code: "654321", minutes: 15 });
    assert.match(en.html, /<html lang="en"/);
    assert.notEqual(en.subject, es.subject);
    const pt = accountDeletionCodeEmail({ locale: "pt", code: "<b>1</b>", minutes: 15 });
    assert.match(pt.html, /<html lang="pt"/);
    assert.equal(pt.html.includes("<b>1</b>"), false);
  });
});