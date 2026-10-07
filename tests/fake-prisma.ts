/**
 * Prisma en memoria para tests de la migración WP (sin MariaDB).
 * Implementa solo lo que usan persist.ts, rehost.ts, legacy-password.ts y los servicios de cuenta
 * (estado/borrado): filtros por relación 1-1 y relaciones en `select`/`include` (se agregan a la fila).
 */
type Row = Record<string, unknown>;

const UNIQUE: Record<string, string[][]> = {
  user: [["email"], ["legacyWpUserId"]],
  boda: [["slug"], ["userId"]],
  legacyMap: [["kind", "wpId"]],
  legacyMedia: [["originalUrl"]],
  rating: [["bodaId", "email"]],
  verificationCode: [["userId", "purpose"]],
  emailLog: [["dedupeKey"]],
  passwordResetToken: [["tokenHash"]],
};

/** Relaciones conocidas: modelo.campo -> modelo relacionado + cómo se une. */
type Relation = { model: string; kind: "one" | "many"; local: string; foreign: string };
const RELATIONS: Record<string, Record<string, Relation>> = {
  user: {
    boda: { model: "boda", kind: "one", local: "id", foreign: "userId" },
    verificationCodes: { model: "verificationCode", kind: "many", local: "id", foreign: "userId" },
  },
  boda: {
    user: { model: "user", kind: "one", local: "userId", foreign: "id" },
    gifts: { model: "gift", kind: "many", local: "id", foreign: "bodaId" },
    pictures: { model: "picture", kind: "many", local: "id", foreign: "bodaId" },
    rsvpGuests: { model: "rsvpGuest", kind: "many", local: "id", foreign: "bodaId" },
  },
};

const NO_UPDATED_AT = new Set(["picture", "legacyMap", "adminAuditLog", "verificationCode", "passwordResetToken"]);

const DEFAULTS: Record<string, Row> = {
  user: {
    role: "couple",
    sessionVersion: 0,
    name: null,
    legacyPasswordHash: null,
    legacyWpUserId: null,
    migratedFromWp: false,
    welcomeSeenAt: null,
    status: "active",
    statusChangedAt: null,
    statusReason: null,
    deletedAt: null,
    erasedAt: null,
  },
  boda: { plan: "free", micrositeTheme: "base", banner: {}, options: {}, misc: {}, isOnline: false },
  confirmedGift: { paymentId: null, currency: "ARS", items: [], confirmed: false },
  legacyMap: { sourceHash: null, runId: null },
  legacyMedia: { wpAttachmentId: null, contentType: null },
  verificationCode: { attempts: 0 },
  emailLog: { replyTo: null, contentEncrypted: null, dedupeKey: null },
};

function isPlainObject(v: unknown): v is Row {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a == null && b == null) return true;
  return a === b;
}

function cmp(a: unknown, b: unknown): number {
  const x = a instanceof Date ? a.getTime() : (a as number);
  const y = b instanceof Date ? b.getTime() : (b as number);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Resuelve una relación 1-1 de la fila (undefined = la clave no es relación). */
type RelationResolver = (row: Row, key: string) => Row | null | undefined;

function matches(row: Row, where: Row | undefined, rel?: RelationResolver): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(cond)) {
      if (!cond.some((c) => matches(row, c as Row, rel))) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(cond)) {
      if (!cond.every((c) => matches(row, c as Row, rel))) return false;
      continue;
    }
    if (key === "NOT" && isPlainObject(cond)) {
      if (matches(row, cond, rel)) return false;
      continue;
    }
    if (!(key in row) && rel && isPlainObject(cond) && !hasOperator(cond)) {
      const related = rel(row, key);
      if (related !== undefined) {
        // Filtro por relación 1-1 (p. ej. boda.user.status), incluye `is`.
        const inner = "is" in cond ? (cond.is as Row) : cond;
        if (!related || !matches(related, inner, rel)) return false;
        continue;
      }
    }
    if (!(key in row) && isPlainObject(cond) && key.includes("_") && !hasOperator(cond)) {
      // Clave única compuesta: kind_wpId, bodaId_email…
      if (!matches(row, cond)) return false;
      continue;
    }
    const value = row[key];
    if (cond === null) {
      if (value != null) return false;
    } else if (isPlainObject(cond) && hasOperator(cond)) {
      if ("in" in cond && !(cond.in as unknown[]).some((c) => sameValue(c, value))) return false;
      if ("notIn" in cond && (cond.notIn as unknown[]).some((c) => sameValue(c, value))) return false;
      if ("not" in cond && sameValue(cond.not, value)) return false;
      if ("gt" in cond && !(value != null && cmp(value, cond.gt) > 0)) return false;
      if ("gte" in cond && !(value != null && cmp(value, cond.gte) >= 0)) return false;
      if ("lt" in cond && !(value != null && cmp(value, cond.lt) < 0)) return false;
      if ("contains" in cond && !(typeof value === "string" && value.includes(String(cond.contains)))) return false;
      if ("equals" in cond && !sameValue(cond.equals, value)) return false;
    } else if (!sameValue(value, cond)) {
      return false;
    }
  }
  return true;
}

function hasOperator(cond: Row): boolean {
  return ["in", "notIn", "not", "gt", "gte", "lt", "contains", "equals"].some((k) => k in cond);
}

const clone = <T>(v: T): T => structuredClone(v);

export interface FakePrisma {
  tables: Record<string, Row[]>;
  writes: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [model: string]: any;
}

export function createFakePrisma(): FakePrisma {
  const tables: Record<string, Row[]> = {};
  const writes: string[] = [];
  let seq = 0;

  function table(name: string): Row[] {
    tables[name] ??= [];
    return tables[name];
  }

  function relationOf(name: string, key: string): Relation | undefined {
    return RELATIONS[name]?.[key];
  }

  function resolverFor(name: string): RelationResolver {
    return (row, key) => {
      const relation = relationOf(name, key);
      if (!relation || relation.kind !== "one") return undefined;
      const found = table(relation.model).find((r) => sameValue(r[relation.foreign], row[relation.local]));
      return found ?? null;
    };
  }

  /** Copia la fila y agrega las relaciones pedidas en select/include (anidadas). */
  function project(name: string, row: Row, shape?: Row): Row {
    const out = clone(row);
    if (!shape) return out;
    for (const [key, spec] of Object.entries(shape)) {
      const relation = relationOf(name, key);
      if (!relation || !spec) continue;
      const nested = isPlainObject(spec) ? ((spec.select ?? spec.include) as Row | undefined) : undefined;
      const where = isPlainObject(spec) ? (spec.where as Row | undefined) : undefined;
      const related = table(relation.model).filter(
        (r) => sameValue(r[relation.foreign], row[relation.local]) && matches(r, where, resolverFor(relation.model)),
      );
      out[key] =
        relation.kind === "one"
          ? related[0]
            ? project(relation.model, related[0], nested)
            : null
          : related.map((r) => project(relation.model, r, nested));
    }
    return out;
  }

  function assertUnique(name: string, row: Row, ignore?: Row) {
    for (const fields of UNIQUE[name] ?? []) {
      if (fields.some((f) => row[f] == null)) continue;
      const clash = table(name).find(
        (other) => other !== ignore && fields.every((f) => sameValue(other[f], row[f])),
      );
      if (clash) throw new Error(`Unique constraint failed on ${name}(${fields.join(",")})`);
    }
  }

  function applyData(row: Row, data: Row) {
    for (const [k, v] of Object.entries(data)) {
      if (isPlainObject(v) && "increment" in v) row[k] = (row[k] as number) + (v.increment as number);
      else if (v !== undefined) row[k] = clone(v);
    }
  }

  function model(name: string) {
    const now = () => new Date();
    const create = (data: Row): Row => {
      const row: Row = { id: `${name}_${++seq}`, ...clone(DEFAULTS[name] ?? {}), createdAt: now() };
      if (!NO_UPDATED_AT.has(name)) row.updatedAt = now();
      if (name === "legacyMap") row.importedAt = now();
      // @default(now()) de User.emailVerifiedAt: si se omite queda verificado; solo un null explícito
      // (registro público) lo deja sin verificar.
      if (name === "user") row.emailVerifiedAt = now();
      applyData(row, data);
      assertUnique(name, row);
      table(name).push(row);
      return row;
    };
    const update = (row: Row, data: Row) => {
      const next = { ...row };
      applyData(next, data);
      if (!NO_UPDATED_AT.has(name) && !("updatedAt" in data)) next.updatedAt = now();
      assertUnique(name, next, row);
      Object.assign(row, next);
    };
    const sorted = (rows: Row[], orderBy?: Row) => {
      if (!orderBy) return rows;
      const [[key, dir]] = Object.entries(orderBy);
      return [...rows].sort((a, b) => cmp(a[key], b[key]) * (dir === "desc" ? -1 : 1));
    };
    const rel = resolverFor(name);
    const hit = (where?: Row) => (r: Row) => matches(r, where, rel);
    type ReadArgs = { where?: Row; orderBy?: Row; take?: number; select?: Row; include?: Row };
    return {
      async findUnique({ where, select, include }: ReadArgs & { where: Row }) {
        const row = table(name).find(hit(where));
        return row ? project(name, row, select ?? include) : null;
      },
      async findFirst({ where, orderBy, select, include }: ReadArgs = {}) {
        const row = sorted(table(name).filter(hit(where)), orderBy)[0];
        return row ? project(name, row, select ?? include) : null;
      },
      async findMany({ where, orderBy, take, select, include }: ReadArgs = {}) {
        const rows = sorted(table(name).filter(hit(where)), orderBy);
        return (take ? rows.slice(0, take) : rows).map((r) => project(name, r, select ?? include));
      },
      async count({ where }: { where?: Row } = {}) {
        return table(name).filter(hit(where)).length;
      },
      async create({ data }: { data: Row }) {
        writes.push(`${name}.create`);
        return clone(create(data));
      },
      async createMany({ data }: { data: Row[] }) {
        writes.push(`${name}.createMany`);
        for (const d of data) create(d);
        return { count: data.length };
      },
      async update({ where, data }: { where: Row; data: Row }) {
        writes.push(`${name}.update`);
        const row = table(name).find(hit(where));
        if (!row) throw new Error(`${name}.update: no existe`);
        update(row, data);
        return clone(row);
      },
      async updateMany({ where, data }: { where?: Row; data: Row }) {
        writes.push(`${name}.updateMany`);
        const rows = table(name).filter(hit(where));
        for (const row of rows) update(row, data);
        return { count: rows.length };
      },
      async upsert({ where, create: c, update: u }: { where: Row; create: Row; update: Row }) {
        writes.push(`${name}.upsert`);
        const row = table(name).find(hit(where));
        if (row) {
          update(row, u);
          return clone(row);
        }
        return clone(create(c));
      },
      async deleteMany({ where }: { where?: Row } = {}) {
        writes.push(`${name}.deleteMany`);
        const rows = table(name);
        const keep = rows.filter((r) => !matches(r, where, rel));
        const count = rows.length - keep.length;
        tables[name] = keep;
        return { count };
      },
    };
  }

  const client: FakePrisma = { tables, writes };
  for (const name of [
    "user",
    "boda",
    "gift",
    "picture",
    "scheduleItem",
    "faqItem",
    "rsvpGuest",
    "confirmedGift",
    "payment",
    "rating",
    "legacyMap",
    "legacyMedia",
    "adminAuditLog",
    "notification",
    "emailLog",
    "verificationCode",
    "passwordResetToken",
  ]) {
    client[name] = model(name);
  }
  client.$transaction = async (fn: (tx: FakePrisma) => Promise<unknown>) => fn(client);
  return client;
}
