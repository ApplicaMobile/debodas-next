"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getAdminAuditContext,
  writeAdminAudit,
} from "@/lib/admin/audit";
import { prisma } from "@/lib/db/prisma";
import {
  migrateAllPending,
  migrateBoda,
  migrateMany,
  rehostBoda,
} from "@/lib/wp-import";

function parseIds(formData: FormData): number[] {
  const many = formData.getAll("wp_post_id").map((v) => Number(v));
  const single = Number(formData.get("wp_post_id") ?? 0);
  const ids = [...many, single].filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)];
}

export async function migrateWpBodaAction(formData: FormData) {
  const admin = await requireAdmin();
  const ids = parseIds(formData);
  const overwrite = formData.get("overwrite") === "1";
  if (ids.length === 0) {
    return;
  }

  const audit = await getAdminAuditContext(admin);
  const results =
    ids.length === 1
      ? [await migrateBoda(ids[0], { overwrite })]
      : await migrateMany(ids, { overwrite });

  await prisma.$transaction(async (tx) => {
    await writeAdminAudit(tx, audit, {
      action: "admin.wp.migrate",
      entity: "wp_boda",
      entityId: ids.join(","),
      metadata: {
        overwrite,
        ok: results.filter((r) => r.ok).length,
        fail: results.filter((r) => !r.ok).length,
        slugs: results.map((r) => r.slug).filter(Boolean),
      },
    });
  });

  revalidatePath("/admin/migracion");
  revalidatePath("/admin/bodas");
  revalidatePath("/admin");
}

export async function migrateAllPendingAction(formData: FormData) {
  const admin = await requireAdmin();
  const overwrite = formData.get("overwrite") === "1";
  const audit = await getAdminAuditContext(admin);
  const results = await migrateAllPending({ overwrite });

  await prisma.$transaction(async (tx) => {
    await writeAdminAudit(tx, audit, {
      action: "admin.wp.migrate_all",
      entity: "wp_boda",
      metadata: {
        overwrite,
        ok: results.filter((r) => r.ok).length,
        fail: results.filter((r) => !r.ok).length,
      },
    });
  });

  revalidatePath("/admin/migracion");
  revalidatePath("/admin/bodas");
  revalidatePath("/admin");
}

export async function rehostWpBodaAction(formData: FormData) {
  const admin = await requireAdmin();
  const bodaId = String(formData.get("boda_id") ?? "").trim();
  if (!bodaId) {
    return;
  }
  const result = await rehostBoda(bodaId);
  const audit = await getAdminAuditContext(admin);
  await prisma.$transaction(async (tx) => {
    await writeAdminAudit(tx, audit, {
      action: "admin.wp.rehost",
      entity: "boda",
      entityId: bodaId,
      metadata: result,
    });
  });
  revalidatePath("/admin/migracion");
}

