"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getAdminAuditContext,
  writeAdminAudit,
} from "@/lib/admin/audit";
import { prisma } from "@/lib/db/prisma";
import {
  ADMIN_BATCH_CAP,
  migrateAllPending,
  migrateMany,
  rehostBoda,
} from "@/lib/wp-import";
import type { WpImportMode, WpMigrateResult } from "@/lib/wp-import";

function parseIds(formData: FormData): number[] {
  const many = formData.getAll("wp_post_id").map((v) => Number(v));
  const single = Number(formData.get("wp_post_id") ?? 0);
  const ids = [...many, single].filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)];
}

function summarize(results: WpMigrateResult[]) {
  const byAction: Record<string, number> = {};
  for (const r of results) {
    const key = r.action ?? (r.ok ? "ok" : "error");
    byAction[key] = (byAction[key] ?? 0) + 1;
  }
  return {
    ok: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    byAction,
    slugs: results.map((r) => r.slug).filter(Boolean).slice(0, 50),
    errors: results
      .filter((r) => !r.ok)
      .map((r) => ({ wpPostId: r.wpPostId, error: r.error }))
      .slice(0, 20),
  };
}

/**
 * Migrar / re-migrar desde el admin. Nunca es destructivo:
 * - "Migrar" → solo si no existe (`only-new`).
 * - "Re-migrar" (`remigrate=1`) → `changed`: solo si cambió en WP y no se editó en Next.
 * El `--overwrite` destructivo queda solo en el CLI (staging).
 */
export async function migrateWpBodaAction(formData: FormData) {
  const admin = await requireAdmin();
  const ids = parseIds(formData).slice(0, ADMIN_BATCH_CAP);
  if (ids.length === 0) {
    return;
  }
  const mode: WpImportMode =
    formData.get("remigrate") === "1" || formData.get("overwrite") === "1" ? "changed" : "only-new";

  const audit = await getAdminAuditContext(admin);
  const results = await migrateMany(ids, { mode });

  await prisma.$transaction(async (tx) => {
    await writeAdminAudit(tx, audit, {
      action: "admin.wp.migrate",
      entity: "wp_boda",
      entityId: ids.join(","),
      metadata: { mode, ...summarize(results) },
    });
  });

  revalidatePath("/admin/migracion");
  revalidatePath("/admin/bodas");
  revalidatePath("/admin");
}

/** "Migrar pendientes": solo nuevas y como máximo ADMIN_BATCH_CAP por clic. */
export async function migrateAllPendingAction() {
  const admin = await requireAdmin();
  const audit = await getAdminAuditContext(admin);
  const { results, pending, cap } = await migrateAllPending({ cap: ADMIN_BATCH_CAP });

  await prisma.$transaction(async (tx) => {
    await writeAdminAudit(tx, audit, {
      action: "admin.wp.migrate_all",
      entity: "wp_boda",
      metadata: { mode: "only-new", pendingBefore: pending, cap, ...summarize(results) },
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
      metadata: {
        updated: result.updated,
        failed: result.failed,
        uploaded: result.uploaded,
        reused: result.reused,
        heicConverted: result.heicConverted,
        heicUnconverted: result.heicUnconverted,
        errors: result.errors.slice(0, 20),
      },
    });
  });
  revalidatePath("/admin/migracion");
}
