/**
 * Baja lógica desde el admin: suspender / reactivar / eliminar / restaurar,
 * visibilidad del micrositio y tombstone para la migración WP.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma, type FakePrisma } from "./fake-prisma";
import { changeAccountStatus, type AccountStatusOp } from "../src/lib/account/admin-status";
import {
  isAccountActive,
  loginOutcomeForStatus,
  normalizeAccountStatus,
  PREV_ONLINE_MISC_KEY,
} from "../src/lib/account/status";
import { resolveMicrositeAccess } from "../src/lib/bodas/visibility";
import { sessionVersionMatches } from "../src/lib/auth/session";
import { rowsToMeta } from "../src/lib/wp-import/acf";
import {
  DeletedAccountImportError,
  isWpUserTombstoned,
  persistWpBoda,
  type PersistContext,
} from "../src/lib/wp-import/persist";
import type { WpBodaRow, WpImportMode, WpUserRow } from "../src/lib/wp-import/types";

const db = (fake: FakePrisma) => fake as unknown as PrismaClient;

async function seed(fake: FakePrisma, opts: { email?: string; isOnline?: boolean; role?: string } = {}) {
  const email = opts.email ?? "pareja@example.com";
  const user = await fake.user.create({
    data: { email, passwordHash: "$2a$04$x", role: opts.role ?? "couple", name: "Ana" },
  });
  const boda = await fake.boda.create({
    data: {
      userId: user.id,
      slug: `boda-${user.id}`,
      title: "Boda",
      isOnline: opts.isOnline ?? true,
      options: { is_online: opts.isOnline === false ? 0 : 1 },
      misc: { wp_post_id: 101 },
    },
  });
  await fake.gift.create({ data: { bodaId: boda.id, title: "Licuadora", price: 10, quantity: 1, sortOrder: 0 } });
  await fake.rsvpGuest.create({ data: { bodaId: boda.id, name: "Tío", email: "tio@example.com" } });
  return { user, boda };
}

async function seedAdmin(fake: FakePrisma, email = "admin@example.com") {
  return fake.user.create({ data: { email, passwordHash: "$2a$04$x", role: "admin" } });
}

function run(fake: FakePrisma, actor: { id: string; email: string }, userId: string, op: AccountStatusOp, extra: { reason?: string; confirmEmail?: string } = {}) {
  return changeAccountStatus(db(fake), {
    actorId: actor.id,
    audit: { actorUserId: actor.id, actorEmail: actor.email, ipHash: null },
    userId,
    op,
    ...extra,
  });
}

const row = (fake: FakePrisma, model: string, id: string) =>
  fake.tables[model].find((r) => r.id === id) as Record<string, unknown>;

describe("estado de cuenta: helpers", () => {
  it("login: suspendida avisa, eliminada se comporta como credenciales inválidas", () => {
    assert.equal(loginOutcomeForStatus("active"), "ok");
    assert.equal(loginOutcomeForStatus(null), "ok");
    assert.equal(loginOutcomeForStatus("suspended"), "suspended");
    assert.equal(loginOutcomeForStatus("deleted"), "invalid");
    assert.equal(isAccountActive("active"), true);
    assert.equal(isAccountActive("suspended"), false);
    assert.equal(isAccountActive("deleted"), false);
    assert.equal(normalizeAccountStatus("raro"), "active");
  });

  it("micrositio: offline solo para dueño/admin; suspendida o eliminada oculta para todos", () => {
    const base = { ownerId: "u1", isOnline: false };
    assert.equal(resolveMicrositeAccess({ ...base, ownerStatus: "active", viewer: null }), "hidden");
    assert.equal(resolveMicrositeAccess({ ...base, ownerStatus: "active", viewer: { userId: "otro", isAdmin: false } }), "hidden");
    assert.equal(resolveMicrositeAccess({ ...base, ownerStatus: "active", viewer: { userId: "u1", isAdmin: false } }), "preview");
    assert.equal(resolveMicrositeAccess({ ...base, ownerStatus: "active", viewer: { userId: "a", isAdmin: true } }), "preview");
    assert.equal(resolveMicrositeAccess({ ...base, isOnline: true, ownerStatus: "active", viewer: null }), "public");
    for (const status of ["suspended", "deleted"]) {
      assert.equal(resolveMicrositeAccess({ ...base, isOnline: true, ownerStatus: status, viewer: null }), "hidden");
      assert.equal(resolveMicrositeAccess({ ...base, isOnline: true, ownerStatus: status, viewer: { userId: "u1", isAdmin: false } }), "hidden");
      assert.equal(resolveMicrositeAccess({ ...base, isOnline: true, ownerStatus: status, viewer: { userId: "a", isAdmin: true } }), "hidden");
    }
  });
});

describe("admin: suspender / reactivar", () => {
  it("suspender corta sesión, oculta el micrositio y audita; reactivar devuelve isOnline", async () => {
    const fake = createFakePrisma();
    const admin = await seedAdmin(fake);
    const { user, boda } = await seed(fake, { isOnline: true });

    const r = await run(fake, admin, user.id, "suspend", { reason: "Pago en disputa" });
    assert.deepEqual(r, { ok: true, status: "suspended", bodaId: boda.id });

    const u = row(fake, "user", user.id);
    assert.equal(u.status, "suspended");
    assert.equal(u.statusReason, "Pago en disputa");
    assert.equal(u.sessionVersion, 1);
    assert.equal(sessionVersionMatches(0, u.sessionVersion as number), false, "el JWT viejo deja de valer");
    assert.equal(loginOutcomeForStatus(u.status as string), "suspended");

    const b = row(fake, "boda", boda.id);
    assert.equal(b.isOnline, false);
    assert.equal((b.options as Record<string, unknown>).is_online, 0);
    assert.equal((b.misc as Record<string, unknown>)[PREV_ONLINE_MISC_KEY], true);
    assert.equal(
      resolveMicrositeAccess({ ownerStatus: u.status as string, isOnline: b.isOnline as boolean, ownerId: user.id, viewer: { userId: user.id, isAdmin: false } }),
      "hidden",
    );

    const audit = fake.tables.adminAuditLog.at(-1)!;
    assert.equal(audit.action, "admin.user.suspended");
    assert.equal(audit.entityId, user.id);

    const back = await run(fake, admin, user.id, "reactivate");
    assert.equal(back.ok, true);
    const u2 = row(fake, "user", user.id);
    const b2 = row(fake, "boda", boda.id);
    assert.equal(u2.status, "active");
    assert.equal(u2.statusReason, null);
    assert.equal(b2.isOnline, true);
    assert.equal((b2.options as Record<string, unknown>).is_online, 1);
    assert.equal(PREV_ONLINE_MISC_KEY in (b2.misc as Record<string, unknown>), false);
    assert.equal((b2.misc as Record<string, unknown>).wp_post_id, 101);
    assert.equal(fake.tables.adminAuditLog.at(-1)!.action, "admin.user.reactivated");
  });

  it("si el micrositio estaba offline, reactivar lo deja offline", async () => {
    const fake = createFakePrisma();
    const admin = await seedAdmin(fake);
    const { user, boda } = await seed(fake, { isOnline: false });
    await run(fake, admin, user.id, "suspend");
    await run(fake, admin, user.id, "reactivate");
    assert.equal(row(fake, "boda", boda.id).isOnline, false);
  });

  it("guardas: no a uno mismo, no al último admin, transiciones inválidas", async () => {
    const fake = createFakePrisma();
    const admin = await seedAdmin(fake);
    const { user } = await seed(fake);

    assert.deepEqual(await run(fake, admin, admin.id, "suspend"), { ok: false, error: "self" });
    assert.deepEqual(await run(fake, admin, user.id, "reactivate"), { ok: false, error: "invalid_transition" });
    assert.deepEqual(await run(fake, admin, user.id, "restore"), { ok: false, error: "invalid_transition" });
    assert.deepEqual(await run(fake, admin, "nope", "suspend"), { ok: false, error: "not_found" });

    // Otro admin que intenta suspender al único admin activo.
    const admin2 = await seedAdmin(fake, "admin2@example.com");
    await run(fake, admin, admin2.id, "suspend"); // admin2 suspendido: queda solo `admin` activo
    const otherActor = { id: "externo", email: "x@example.com" };
    assert.deepEqual(await run(fake, otherActor, admin.id, "suspend"), { ok: false, error: "last_admin" });
    assert.equal(row(fake, "user", admin.id).status, "active");
  });
});

describe("admin: eliminar (baja lógica) / restaurar", () => {
  it("pide el email exacto, oculta todo y conserva todas las filas", async () => {
    const fake = createFakePrisma();
    const admin = await seedAdmin(fake);
    const { user, boda } = await seed(fake, { isOnline: true });
    const before = JSON.stringify({ gift: fake.tables.gift, rsvpGuest: fake.tables.rsvpGuest });

    assert.deepEqual(await run(fake, admin, user.id, "delete"), { ok: false, error: "confirm_email" });
    assert.deepEqual(await run(fake, admin, user.id, "delete", { confirmEmail: "otro@example.com" }), { ok: false, error: "confirm_email" });
    assert.equal(row(fake, "user", user.id).status, "active");

    const r = await run(fake, admin, user.id, "delete", { confirmEmail: " PAREJA@example.com " });
    assert.equal(r.ok, true);
    const u = row(fake, "user", user.id);
    assert.equal(u.status, "deleted");
    assert.ok(u.deletedAt instanceof Date);
    assert.equal(u.email, "pareja@example.com", "el email queda reservado (sin anonimizar)");
    assert.equal(u.name, "Ana");
    assert.equal(loginOutcomeForStatus(u.status as string), "invalid");
    assert.equal(row(fake, "boda", boda.id).isOnline, false);
    assert.equal(row(fake, "boda", boda.id).slug, boda.slug, "el slug queda reservado");
    assert.equal(JSON.stringify({ gift: fake.tables.gift, rsvpGuest: fake.tables.rsvpGuest }), before);
    assert.equal(fake.writes.some((w) => w.endsWith(".deleteMany")), false, "no se borra nada");

    // Lista de la home / sitemap: filtro por relación boda.user.status
    const visible = await fake.boda.findMany({ where: { isOnline: true, user: { status: "active" } } });
    assert.equal(visible.length, 0);

    const restored = await run(fake, admin, user.id, "restore");
    assert.equal(restored.ok, true);
    assert.equal(row(fake, "user", user.id).status, "active");
    assert.equal(row(fake, "user", user.id).deletedAt, null);
    assert.equal(row(fake, "boda", boda.id).isOnline, true);
    assert.deepEqual(
      fake.tables.adminAuditLog.map((a) => a.action),
      ["admin.user.deleted", "admin.user.restored"],
    );
  });

  it("suspendida y después eliminada: restaurar recupera el isOnline original", async () => {
    const fake = createFakePrisma();
    const admin = await seedAdmin(fake);
    const { user, boda } = await seed(fake, { isOnline: true });
    await run(fake, admin, user.id, "suspend");
    await run(fake, admin, user.id, "delete", { confirmEmail: "pareja@example.com" });
    assert.equal((row(fake, "boda", boda.id).misc as Record<string, unknown>)[PREV_ONLINE_MISC_KEY], true);
    await run(fake, admin, user.id, "restore");
    assert.equal(row(fake, "boda", boda.id).isOnline, true);
  });

  it("no se puede restaurar una cuenta borrada por la pareja", async () => {
    const fake = createFakePrisma();
    const admin = await seedAdmin(fake);
    const { user } = await seed(fake);
    await fake.user.update({ where: { id: user.id }, data: { status: "deleted", erasedAt: new Date() } });
    assert.deepEqual(await run(fake, admin, user.id, "restore"), { ok: false, error: "erased" });
  });
});

// ---------- WordPress: una cuenta eliminada no se reimporta ----------

function wpBoda(id: number, slug: string): WpBodaRow {
  return {
    ID: id,
    post_title: `Boda ${id}`,
    post_name: slug,
    post_author: 7,
    post_date: new Date("2025-01-01T00:00:00Z"),
    post_modified: new Date("2026-05-01T10:00:00Z"),
  };
}
function wpUser(id = 7, email = "pareja@example.com"): WpUserRow {
  return { ID: id, user_email: email, display_name: "Ana y Juan", user_pass: "$P$Bxxxxxxxx", user_registered: new Date("2024-12-01T00:00:00Z") };
}
const wpMeta = () =>
  rowsToMeta([
    { meta_key: "couple_bride_name", meta_value: "Ana" },
    { meta_key: "plan", meta_value: "premium" },
  ]);
function ctx(fake: FakePrisma, mode: WpImportMode = "only-new"): PersistContext {
  return { db: db(fake), mode, dryRun: false, runId: "test", usedEmails: new Set() };
}

describe("WP: tombstone de cuentas eliminadas", () => {
  it("una boda importada cuyo dueño fue eliminado se saltea en todos los modos", async () => {
    const fake = createFakePrisma();
    const input = { boda: wpBoda(101, "ana-y-juan"), meta: wpMeta(), user: wpUser(), attachments: new Map() };
    const first = await persistWpBoda(input, ctx(fake));
    assert.equal(first.action, "created");
    const userId = fake.tables.user[0].id as string;
    await fake.user.update({ where: { id: userId }, data: { status: "deleted", deletedAt: new Date() } });

    for (const mode of ["only-new", "changed", "overwrite"] as WpImportMode[]) {
      const again = await persistWpBoda(input, ctx(fake, mode));
      assert.equal(again.action, "skipped", mode);
      assert.equal(again.reason, "account_deleted", mode);
    }
    assert.equal(fake.tables.user.length, 1);
    assert.equal(fake.tables.boda.length, 1);
    assert.equal(fake.tables.user[0].status, "deleted");
  });

  it("no crea una boda nueva para un usuario WP eliminado (por id o por email)", async () => {
    const fake = createFakePrisma();
    await fake.user.create({
      data: { email: "pareja@example.com", passwordHash: "x", legacyWpUserId: 7, status: "deleted" },
    });
    assert.equal(await isWpUserTombstoned(db(fake), { wpUserId: 7 }), true);
    assert.equal(await isWpUserTombstoned(db(fake), { email: "PAREJA@example.com" }), true);
    assert.equal(await isWpUserTombstoned(db(fake), { wpUserId: 8, email: "otra@example.com" }), false);

    const input = { boda: wpBoda(202, "otra-boda"), meta: wpMeta(), user: wpUser(), attachments: new Map() };
    await assert.rejects(persistWpBoda(input, ctx(fake)), DeletedAccountImportError);
    const byEmail = { ...input, user: wpUser(99, "pareja@example.com") };
    await assert.rejects(persistWpBoda(byEmail, ctx(fake)), DeletedAccountImportError);
    assert.equal(fake.tables.boda?.length ?? 0, 0);
    assert.equal(fake.tables.user.length, 1);
  });
});