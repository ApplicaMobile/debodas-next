/**
 * Migración WordPress → Next: contraseñas legadas, import idempotente,
 * rehost con dedupe, flags del CLI, redirects y bandera de bienvenida.
 * Todo con un Prisma en memoria (tests/fake-prisma.ts): no hace falta MariaDB.
 */
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { compare, hash } from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { createFakePrisma, type FakePrisma } from "./fake-prisma";
import { hashPhpass } from "../src/lib/wp-import/phpass";
import {
  classifyWpHash,
  planImportPassword,
  verifyWpHash,
  wpPrehashPassword,
} from "../src/lib/wp-import/passwords";
import { checkUserPassword } from "../src/lib/auth/legacy-password";
import { rowsToMeta } from "../src/lib/wp-import/acf";
import { persistWpBoda, type PersistContext } from "../src/lib/wp-import/persist";
import type { WpBodaRow, WpImportMode, WpUserRow } from "../src/lib/wp-import/types";
import { rehostBodaImages, createRehostSession } from "../src/lib/wp-import/rehost";
import { CliArgsError, parseWpImportArgs } from "../src/lib/wp-import/cli-args";
import { legacyRedirectFor } from "../src/lib/routing/legacy-redirects";
import { shouldShowMigrationWelcome } from "../src/lib/account/migration-welcome";
import { redactDatabaseUrl } from "../src/lib/wp-import/run-log";

// Hash generado por PHP 8 (password_hash) tal como lo hace wp_hash_password() de WP 6.8
// para la clave "Secreto 123": "$wp" . password_hash(base64(hmac_sha384), PASSWORD_BCRYPT).
const PHP_WP68_HASH = "$wp$2y$10$Bc9b9lnNpUjq6DgIp5flhefJeotDvj3Os/Lnw4mnbfLn4pxcod9dC";

async function wp68Hash(password: string): Promise<string> {
  // bcryptjs genera $2b$; PHP genera $2y$ (mismo algoritmo).
  const inner = (await hash(wpPrehashPassword(password), 4)).replace(/^\$2b\$/, "$2y$");
  return `$wp${inner}`;
}

describe("contraseñas legadas de WordPress", () => {
  it("$wp$2y$ (WP 6.8): verifica con el pre-hash HMAC-SHA384", async () => {
    const stored = await wp68Hash("Secreto 123");
    assert.equal(classifyWpHash(stored), "wp-bcrypt");
    assert.equal(await verifyWpHash("Secreto 123", stored), true);
    assert.equal(await verifyWpHash("  Secreto 123  ", stored), true, "WP recorta la clave al hashear");
    assert.equal(await verifyWpHash("otra", stored), false);
    // El bug viejo: comparar la clave directa contra hash sin "$wp" da false.
    assert.equal(await compare("Secreto 123", stored.slice(3)), false);
  });

  it("$wp$2y$ generado por PHP real", { skip: PHP_WP68_HASH.startsWith("__") }, async () => {
    assert.equal(await verifyWpHash("Secreto 123", PHP_WP68_HASH), true);
    assert.equal(await verifyWpHash("secreto 123", PHP_WP68_HASH), false);
  });

  it("pre-hash igual a base64(hash_hmac('sha384', trim(clave), 'wp-sha384', true))", () => {
    const expected = createHmac("sha384", "wp-sha384").update("abc").digest("base64");
    assert.equal(wpPrehashPassword(" abc "), expected);
  });

  it("MD5 de 32 caracteres (comparación en tiempo constante)", async () => {
    const md5 = createHash("md5").update("vieja-clave").digest("hex");
    assert.equal(classifyWpHash(md5), "md5");
    assert.equal(await verifyWpHash("vieja-clave", md5), true);
    assert.equal(await verifyWpHash("vieja-clave", md5.toUpperCase()), true);
    assert.equal(await verifyWpHash("otra", md5), false);
  });

  it("phpass $P$ sigue funcionando", async () => {
    const stored = hashPhpass("clave-phpass");
    assert.equal(classifyWpHash(stored), "phpass");
    assert.equal(await verifyWpHash("clave-phpass", stored), true);
    assert.equal(await verifyWpHash("nop", stored), false);
  });

  it("bcrypt puro $2y$ y formatos desconocidos", async () => {
    const plain = (await hash("pura", 4)).replace(/^\$2b\$/, "$2y$");
    assert.equal(classifyWpHash(plain), "bcrypt");
    assert.equal(await verifyWpHash("pura", plain), true);
    assert.equal(classifyWpHash("$argon2id$v=19$m=65536"), "unknown");
    assert.equal(await verifyWpHash("x", "$argon2id$v=19$m=65536"), false);
    assert.equal(await verifyWpHash("x", ""), false);
  });

  it("planImportPassword guarda el hash original en legacyPasswordHash", async () => {
    const md5 = createHash("md5").update("x").digest("hex");
    const p = await planImportPassword(md5);
    assert.equal(p.legacyPasswordHash, md5);
    assert.equal(p.needsReset, false);
    assert.ok(p.passwordHash.startsWith("$2"));
    assert.equal(await compare("x", p.passwordHash), false, "el relleno no es la clave");

    const wp = await wp68Hash("y");
    assert.equal((await planImportPassword(wp)).legacyPasswordHash, wp);

    const pure = (await hash("z", 4)).replace(/^\$2b\$/, "$2y$");
    const pp = await planImportPassword(pure);
    assert.equal(pp.passwordHash, pure);
    assert.equal(pp.legacyPasswordHash, null);

    const unknown = await planImportPassword("");
    assert.equal(unknown.needsReset, true);
  });
});

describe("login con hash legado", () => {
  it("si bcrypt falla y el legado coincide, rehashea a bcrypt y vacía el legado", async () => {
    const fake = createFakePrisma();
    const legacy = hashPhpass("mi-clave-wp");
    const user = await fake.user.create({
      data: { email: "a@b.com", passwordHash: await hash("relleno-aleatorio", 4), legacyPasswordHash: legacy },
    });
    const bad = await checkUserPassword(fake as never, user, "incorrecta");
    assert.equal(bad.ok, false);
    assert.equal(fake.writes.length, 1, "un fallo no escribe nada");

    const ok = await checkUserPassword(fake as never, user, "mi-clave-wp");
    assert.deepEqual(ok, { ok: true, via: "legacy", rehashed: true });
    const after = await fake.user.findUnique({ where: { id: user.id } });
    assert.equal(after.legacyPasswordHash, null);
    assert.equal(await compare("mi-clave-wp", after.passwordHash), true);

    // Segundo login: ya entra por bcrypt.
    const again = await checkUserPassword(fake as never, after, "mi-clave-wp");
    assert.deepEqual(again, { ok: true, via: "bcrypt" });
  });

  it("$wp$2y$ y MD5 también migran en el login", async () => {
    const fake = createFakePrisma();
    for (const [i, stored] of [
      await wp68Hash("clave68"),
      createHash("md5").update("clave68").digest("hex"),
    ].entries()) {
      const user = await fake.user.create({
        data: { email: `u${i}@b.com`, passwordHash: "x", legacyPasswordHash: stored },
      });
      const r = await checkUserPassword(fake as never, user, "clave68");
      assert.equal(r.ok, true);
      const after = await fake.user.findUnique({ where: { id: user.id } });
      assert.equal(after.legacyPasswordHash, null);
    }
  });

  it("sin legado, una clave incorrecta no entra", async () => {
    const fake = createFakePrisma();
    const user = await fake.user.create({
      data: { email: "c@d.com", passwordHash: await hash("buena", 4) },
    });
    assert.equal((await checkUserPassword(fake as never, user, "mala")).ok, false);
    assert.equal((await checkUserPassword(fake as never, user, "buena")).ok, true);
  });
});

// ---------- Import idempotente ----------

function wpBoda(id: number, slug: string, modified = "2026-05-01T10:00:00Z"): WpBodaRow {
  return {
    ID: id,
    post_title: `Boda ${id}`,
    post_name: slug,
    post_author: 7,
    post_date: new Date("2025-01-01T00:00:00Z"),
    post_modified: new Date(modified),
  };
}

function wpMeta(extra: Record<string, string> = {}) {
  const rows: Record<string, string> = {
    couple_bride_name: "Ana",
    couple_groom_name: "Juan",
    plan: "premium",
    gifts_list_gifts: "2",
    gifts_list_gifts_0_title: "Licuadora",
    gifts_list_gifts_0_price: "1000",
    gifts_list_gifts_1_title: "Viaje",
    gifts_list_gifts_1_price: "5000",
    ...extra,
  };
  return rowsToMeta(Object.entries(rows).map(([meta_key, meta_value]) => ({ meta_key, meta_value })));
}

function wpUser(id = 7, email = "pareja@example.com", pass = hashPhpass("clave-de-wp")): WpUserRow {
  return {
    ID: id,
    user_email: email,
    display_name: "Ana y Juan",
    user_pass: pass,
    user_registered: new Date("2024-12-01T00:00:00Z"),
  };
}

function ctx(fake: FakePrisma, mode: WpImportMode = "only-new", dryRun = false): PersistContext {
  return {
    db: fake as unknown as PrismaClient,
    mode,
    dryRun,
    runId: "test-run",
    usedEmails: new Set(),
  };
}

/** Simula que pasó el tiempo desde el import (para distinguir ediciones posteriores). */
function ageAll(fake: FakePrisma, ms: number) {
  for (const rows of Object.values(fake.tables)) {
    for (const row of rows) {
      for (const key of ["createdAt", "updatedAt", "importedAt"]) {
        if (row[key] instanceof Date) row[key] = new Date((row[key] as Date).getTime() - ms);
      }
    }
  }
}

const HOUR = 60 * 60 * 1000;

describe("import idempotente (legacy_map)", () => {
  it("crea usuario con hash legado, bandera de migración y mapeo", async () => {
    const fake = createFakePrisma();
    const user = wpUser();
    const r = await persistWpBoda({ boda: wpBoda(101, "ana-y-juan"), meta: wpMeta(), user, attachments: new Map() }, ctx(fake));
    assert.equal(r.ok, true);
    assert.equal(r.action, "created");
    assert.equal(r.hashKind, "phpass");
    const [u] = fake.tables.user;
    assert.equal(u.legacyPasswordHash, user.user_pass);
    assert.equal(u.migratedFromWp, true);
    assert.equal(u.legacyWpUserId, 7);
    assert.equal(fake.tables.gift.length, 2);
    const maps = fake.tables.legacyMap.map((m) => `${m.kind}:${m.wpId}`).sort();
    assert.deepEqual(maps, ["boda:101", "user:7"]);
    assert.equal(fake.tables.boda[0].misc && (fake.tables.boda[0].misc as Record<string, unknown>).wp_post_id, 101);
  });

  it("re-importar no cambia contraseñas ni borra hijos creados en Next", async () => {
    const fake = createFakePrisma();
    const input = { boda: wpBoda(101, "ana-y-juan"), meta: wpMeta(), user: wpUser(), attachments: new Map() };
    await persistWpBoda(input, ctx(fake));
    ageAll(fake, HOUR);

    // En Next la pareja cambió la clave y agregó un regalo.
    const userId = fake.tables.user[0].id as string;
    const bodaId = fake.tables.boda[0].id as string;
    const newHash = await hash("clave-nueva-next", 4);
    await fake.user.update({ where: { id: userId }, data: { passwordHash: newHash, legacyPasswordHash: null } });
    await fake.gift.create({ data: { bodaId, title: "Cafetera (Next)", price: 10, quantity: 1, sortOrder: 9 } });

    // only-new (por defecto): se saltea.
    const again = await persistWpBoda(input, ctx(fake));
    assert.equal(again.action, "skipped");
    assert.equal(again.reason, "already_imported");

    // changed: cambió en WP, pero se editó en Next → no se pisa.
    const changedInput = { ...input, meta: wpMeta({ gifts_list_gifts_0_title: "Licuadora PRO" }), boda: wpBoda(101, "ana-y-juan", "2026-06-01T00:00:00Z") };
    const changed = await persistWpBoda(changedInput, ctx(fake, "changed"));
    assert.equal(changed.action, "skipped");
    assert.equal(changed.reason, "edited_in_next");

    const u = await fake.user.findUnique({ where: { id: userId } });
    assert.equal(u.passwordHash, newHash);
    assert.equal(u.legacyPasswordHash, null);
    assert.equal(fake.tables.gift.length, 3);
    assert.ok(fake.tables.gift.some((g) => g.title === "Cafetera (Next)"));
    assert.equal(fake.tables.boda.length, 1);
    assert.equal(fake.tables.user.length, 1);
  });

  it("--changed re-importa si cambió en WP y no hubo ediciones; si no cambió, saltea", async () => {
    const fake = createFakePrisma();
    const input = { boda: wpBoda(5, "x-y-z"), meta: wpMeta(), user: wpUser(), attachments: new Map() };
    await persistWpBoda(input, ctx(fake));
    ageAll(fake, HOUR);
    const passwordBefore = fake.tables.user[0].passwordHash;

    const same = await persistWpBoda(input, ctx(fake, "changed"));
    assert.equal(same.reason, "unchanged");

    const changed = await persistWpBoda(
      { ...input, meta: wpMeta({ gifts_list_gifts: "1" }), boda: wpBoda(5, "x-y-z", "2026-07-01T00:00:00Z") },
      ctx(fake, "changed"),
    );
    assert.equal(changed.action, "updated");
    assert.equal(fake.tables.gift.length, 1);
    assert.equal(fake.tables.user[0].passwordHash, passwordBefore, "la clave no se toca");
  });

  it("--overwrite reemplaza hijos pero conserva claves y regalos pagados en Next", async () => {
    const fake = createFakePrisma();
    const input = { boda: wpBoda(9, "boda-nueve"), meta: wpMeta(), user: wpUser(), attachments: new Map() };
    await persistWpBoda(input, ctx(fake));
    const bodaId = fake.tables.boda[0].id as string;
    const legacyBefore = fake.tables.user[0].legacyPasswordHash;
    await fake.confirmedGift.create({ data: { bodaId, participants: "Tía", method: "mercadopago", amount: 100, paymentId: "pay_1" } });
    const r = await persistWpBoda(input, ctx(fake, "overwrite"));
    assert.equal(r.action, "overwritten");
    assert.equal(fake.tables.gift.length, 2);
    assert.equal(fake.tables.confirmedGift.filter((g) => g.paymentId === "pay_1").length, 1);
    assert.equal(fake.tables.user[0].legacyPasswordHash, legacyBefore);
  });

  it("slug duplicado: no pisa la otra boda, agrega sufijo y avisa", async () => {
    const fake = createFakePrisma();
    const slug = "antonela-y-alexis-20240420";
    const r1 = await persistWpBoda(
      { boda: wpBoda(200, slug), meta: wpMeta(), user: wpUser(20, "uno@example.com"), attachments: new Map() },
      ctx(fake),
    );
    const r2 = await persistWpBoda(
      { boda: wpBoda(201, slug), meta: wpMeta(), user: wpUser(21, "dos@example.com"), attachments: new Map() },
      ctx(fake),
    );
    assert.equal(r1.slug, slug);
    assert.equal(r2.slug, `${slug}-201`);
    assert.ok(r2.warnings?.some((w) => w.code === "DUPLICATE_SLUG"));
    assert.equal(fake.tables.boda.length, 2);

    // Re-run: identidad por ID de WP, no por slug → nada nuevo.
    const again = await persistWpBoda(
      { boda: wpBoda(201, slug), meta: wpMeta(), user: wpUser(21, "dos@example.com"), attachments: new Map() },
      ctx(fake),
    );
    assert.equal(again.action, "skipped");
    assert.equal(again.bodaId, r2.bodaId);
    assert.equal(fake.tables.boda.length, 2);
  });

  it("una pareja con dos bodas recibe email +bodaN en la segunda", async () => {
    const fake = createFakePrisma();
    const user = wpUser(30, "multi@example.com");
    await persistWpBoda({ boda: wpBoda(300, "primera"), meta: wpMeta(), user, attachments: new Map() }, ctx(fake));
    const r = await persistWpBoda({ boda: wpBoda(301, "segunda"), meta: wpMeta(), user, attachments: new Map() }, ctx(fake));
    assert.equal(r.email, "multi+boda301@example.com");
    assert.ok(r.warnings?.some((w) => w.code === "MULTI_BODA_OWNER"));
    const second = fake.tables.user.find((u) => u.email === "multi+boda301@example.com")!;
    assert.equal(second.legacyWpUserId, null, "legacyWpUserId es único: solo el principal");
    assert.equal(second.migratedFromWp, true);
  });

  it("dry-run no escribe nada", async () => {
    const fake = createFakePrisma();
    const r = await persistWpBoda(
      { boda: wpBoda(400, "seca"), meta: wpMeta(), user: wpUser(), attachments: new Map() },
      ctx(fake, "only-new", true),
    );
    assert.equal(r.action, "would_create");
    assert.equal(r.counts?.gifts, 2);
    assert.deepEqual(fake.writes, []);
    assert.equal(Object.values(fake.tables).reduce((n, rows) => n + rows.length, 0), 0);
  });

  it("adopta bodas importadas por el motor viejo (misc.wp_post_id) sin tocarlas", async () => {
    const fake = createFakePrisma();
    const owner = await fake.user.create({ data: { email: "vieja@example.com", passwordHash: "h" } });
    const old = await fake.boda.create({
      data: { userId: owner.id, slug: "vieja", title: "Vieja", couple: {}, event: {}, misc: { wp_post_id: 500 } },
    });
    const r = await persistWpBoda({ boda: wpBoda(500, "vieja"), meta: wpMeta(), user: wpUser(50, "vieja@example.com"), attachments: new Map() }, ctx(fake, "changed"));
    assert.equal(r.action, "skipped");
    assert.equal(r.reason, "no_baseline");
    assert.equal(r.bodaId, old.id);
    assert.equal(fake.tables.legacyMap.length, 1);
    assert.equal(fake.tables.gift?.length ?? 0, 0);
  });
});

// ---------- Rehost ----------

describe("rehost con dedupe por contenido", () => {
  function setup() {
    const root = mkdtempSync(path.join(os.tmpdir(), "debodas-rehost-"));
    const dir = path.join(root, "2024", "05");
    mkdirSync(dir, { recursive: true });
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("misma-foto")]);
    writeFileSync(path.join(dir, "a.jpg"), jpg);
    writeFileSync(path.join(dir, "a-copia.jpg"), jpg);
    const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypheic"), Buffer.alloc(16)]);
    writeFileSync(path.join(dir, "iphone.heic"), heic);
    return { root, jpg };
  }

  async function seedBoda(fake: FakePrisma) {
    const owner = await fake.user.create({ data: { email: "r@example.com", passwordHash: "h" } });
    const base = "https://debodas.com.ar/wp-content/uploads/2024/05";
    const boda = await fake.boda.create({
      data: {
        userId: owner.id,
        slug: "rehost",
        title: "Rehost",
        couple: {},
        event: {},
        featuredImageUrl: `${base}/a.jpg`,
        banner: { image: { url: `${base}/a.jpg`, id: 77 } },
        misc: {
          invitations: [{ id: "i1", cover_image: `${base}/a-copia.jpg` }],
          dress_code: { image: { url: `${base}/iphone.heic` } },
          spotify_url: "https://open.spotify.com/x",
        },
      },
    });
    await fake.picture.createMany({
      data: [
        { bodaId: boda.id, url: `${base}/a.jpg`, sortOrder: 0 },
        { bodaId: boda.id, url: `${base}/a-copia.jpg?ver=2`, sortOrder: 1 },
      ],
    });
    return boda;
  }

  it("guarda una sola vez el mismo contenido, cubre invitations/dress_code y es re-ejecutable", async () => {
    const { root } = setup();
    const fake = createFakePrisma();
    const boda = await seedBoda(fake);
    const stored: string[] = [];
    const store = async (input: { subdir: string; filename: string }) => {
      stored.push(input.filename);
      return `/uploads/${input.subdir}/${input.filename}`;
    };
    const opts = {
      client: fake as unknown as PrismaClient,
      fromUploadsDir: root,
      store,
      fileExists: () => true,
      sharpLoader: async () => null,
      fetchImpl: (async () => {
        throw new Error("no debería ir a la red");
      }) as unknown as typeof fetch,
    };

    const first = await rehostBodaImages(boda.id, { ...opts, session: createRehostSession() });
    assert.equal(first.failed, 0);
    assert.equal(stored.filter((f) => f.endsWith(".jpg")).length, 1, "a.jpg y a-copia.jpg comparten archivo");
    assert.equal(first.heicUnconverted, 1);

    const b = await fake.boda.findUnique({ where: { id: boda.id } });
    const jpgPath = b.featuredImageUrl as string;
    assert.match(jpgPath, /^\/uploads\/migrated\/media\/[0-9a-f]{2}\/[0-9a-f]{64}\.jpg$/);
    assert.equal(b.banner.image.url, jpgPath);
    assert.equal(b.misc.invitations[0].cover_image, jpgPath);
    assert.match(b.misc.dress_code.image.url, /\.heic$/);
    assert.equal(b.misc.spotify_url, "https://open.spotify.com/x");
    assert.equal(b.updatedAt.getTime(), boda.updatedAt.getTime(), "el rehost no cuenta como edición");
    const pics = fake.tables.picture.map((p) => p.url);
    assert.deepEqual(pics, [jpgPath, jpgPath]);

    const media = fake.tables.legacyMedia;
    assert.equal(media.length, 3);
    assert.equal(new Set(media.filter((m) => String(m.newPath).endsWith(".jpg")).map((m) => m.sha256)).size, 1);
    assert.equal(media.find((m) => String(m.originalUrl).endsWith("/a.jpg"))?.wpAttachmentId, 77);
    assert.ok(media.every((m) => !String(m.originalUrl).includes("?")), "URL normalizada sin query");

    // Segunda corrida (sesión nueva): no vuelve a guardar nada.
    stored.length = 0;
    // Simulamos que las URLs viejas vuelven (p. ej. re-import) para probar la tabla legacy_media.
    await fake.picture.create({ data: { bodaId: boda.id, url: "https://debodas.com.ar/wp-content/uploads/2024/05/a.jpg", sortOrder: 2 } });
    const second = await rehostBodaImages(boda.id, { ...opts, session: createRehostSession() });
    assert.equal(stored.length, 0);
    assert.ok(second.reused >= 1);
    assert.equal(fake.tables.legacyMedia.length, 3);
  });

  it("convierte HEIC a JPG con sharp si está disponible", async () => {
    const { root } = setup();
    const fake = createFakePrisma();
    const boda = await seedBoda(fake);
    const fakeSharp = () => ({
      rotate: () => ({
        jpeg: () => ({ toBuffer: async () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from("convertida")]) }),
      }),
    });
    const r = await rehostBodaImages(boda.id, {
      client: fake as unknown as PrismaClient,
      fromUploadsDir: root,
      store: async (i) => `/uploads/${i.subdir}/${i.filename}`,
      sharpLoader: async () => fakeSharp,
    });
    assert.equal(r.heicConverted, 1);
    const b = await fake.boda.findUnique({ where: { id: boda.id } });
    assert.match(b.misc.dress_code.image.url, /\.jpg$/);
  });

  it("si sharp no puede decodificar el HEIC, lo copia tal cual (no lo deja en WP)", async () => {
    const { root } = setup();
    const fake = createFakePrisma();
    const boda = await seedBoda(fake);
    const brokenSharp = () => ({
      rotate: () => ({
        jpeg: () => ({
          toBuffer: async () => {
            throw new Error("heif: Unsupported compression");
          },
        }),
      }),
    });
    const r = await rehostBodaImages(boda.id, {
      client: fake as unknown as PrismaClient,
      fromUploadsDir: root,
      store: async (i) => `/uploads/${i.subdir}/${i.filename}`,
      sharpLoader: async () => brokenSharp,
    });
    assert.equal(r.failed, 0);
    assert.equal(r.heicUnconverted, 1);
    const b = await fake.boda.findUnique({ where: { id: boda.id } });
    assert.match(b.misc.dress_code.image.url, /^\/uploads\/migrated\/media\/.+\.heic$/);
  });

  it("respeta el límite de tamaño configurable y no escribe en dry-run", async () => {
    const { root } = setup();
    const fake = createFakePrisma();
    const boda = await seedBoda(fake);
    const writesBefore = fake.writes.length;
    const dry = await rehostBodaImages(boda.id, {
      client: fake as unknown as PrismaClient,
      fromUploadsDir: root,
      dryRun: true,
      store: async () => {
        throw new Error("dry-run no guarda");
      },
      sharpLoader: async () => null,
    });
    assert.equal(dry.failed, 0);
    assert.equal(fake.writes.length, writesBefore);

    const tiny = await rehostBodaImages(boda.id, {
      client: fake as unknown as PrismaClient,
      fromUploadsDir: root,
      maxBytes: 4,
      store: async (i) => `/uploads/${i.subdir}/${i.filename}`,
      sharpLoader: async () => null,
    });
    assert.ok(tiny.failed > 0);
    assert.ok(tiny.errors.some((e) => /supera el límite/.test(e.error)));
  });
});

describe("CLI db:import-wp", () => {
  it("por defecto es only-new", () => {
    const a = parseWpImportArgs([], {});
    assert.equal(a.mode, "only-new");
    assert.equal(a.dryRun, false);
  });

  it("parsea ids, limit y dry-run", () => {
    const a = parseWpImportArgs(["--dry-run", "--changed", "--ids=3,1,3", "--limit=5"], {});
    assert.equal(a.mode, "changed");
    assert.deepEqual(a.ids, [3, 1]);
    assert.equal(a.limit, 5);
    assert.equal(a.dryRun, true);
  });

  it("--overwrite se bloquea en producción salvo --force", () => {
    assert.throws(() => parseWpImportArgs(["--overwrite"], { NODE_ENV: "production" }), CliArgsError);
    assert.equal(parseWpImportArgs(["--overwrite", "--force"], { NODE_ENV: "production" }).mode, "overwrite");
    assert.equal(parseWpImportArgs(["--overwrite"], { NODE_ENV: "development" }).mode, "overwrite");
  });

  it("rechaza modos combinados y flags desconocidos", () => {
    assert.throws(() => parseWpImportArgs(["--changed", "--overwrite"], {}), CliArgsError);
    assert.throws(() => parseWpImportArgs(["--todo"], {}), CliArgsError);
  });

  it("no imprime credenciales de la base", () => {
    const shown = redactDatabaseUrl("mysql://user:supersecreta@db.example:3306/debodas_wp_legacy");
    assert.equal(shown.includes("supersecreta"), false);
    assert.equal(shown.includes("user"), false);
    assert.equal(shown, "mysql://db.example:3306/debodas_wp_legacy");
  });
});

describe("redirects 301 del WordPress viejo", () => {
  const cases: Array<[string, string | null]> = [
    ["/terminos-y-condiciones/", "/terminos"],
    ["/verificacion-de-email", "/login"],
    ["/tienda/", "/"],
    ["/producto/premium/", "/"],
    ["/regalo/licuadora", "/"],
    ["/regalos-categorias/hogar/", "/"],
    ["/blog/", "/"],
    ["/category/deco/", "/"],
    ["/author/admin/", "/"],
    ["/hola-mundo/", "/"],
    ["/maquillaje-ultra-fino", "/"],
    ["/bodas/ana-y-juan", null],
    ["/terminos", null],
    ["/regalos", null],
    ["/", null],
  ];
  for (const [from, to] of cases) {
    it(`${from} → ${to ?? "(sin redirect)"}`, () => {
      assert.equal(legacyRedirectFor(from), to);
    });
  }
});

describe("bienvenida a parejas migradas", () => {
  it("solo si migratedFromWp y todavía no la vio", () => {
    assert.equal(shouldShowMigrationWelcome({ migratedFromWp: true, welcomeSeenAt: null }), true);
    assert.equal(shouldShowMigrationWelcome({ migratedFromWp: true, welcomeSeenAt: new Date() }), false);
    assert.equal(shouldShowMigrationWelcome({ migratedFromWp: false, welcomeSeenAt: null }), false);
    assert.equal(shouldShowMigrationWelcome(null), false);
  });
});
