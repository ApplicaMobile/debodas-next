import type { Prisma, PrismaClient } from "@prisma/client";
import { ADMIN_ROLE, isAdminRole } from "@/lib/auth/roles";
import {
  normalizeAccountStatus,
  PREV_ONLINE_MISC_KEY,
  type AccountStatus,
} from "@/lib/account/status";

export type AccountStatusOp = "suspend" | "reactivate" | "delete" | "restore";

export const ACCOUNT_STATUS_OPS: AccountStatusOp[] = [
  "suspend",
  "reactivate",
  "delete",
  "restore",
];

export type AccountStatusError =
  | "not_found"
  | "self"
  | "last_admin"
  | "invalid_transition"
  | "confirm_email"
  | "erased";

export interface AccountStatusAudit {
  actorUserId: string;
  actorEmail: string;
  ipHash: string | null;
}

export interface ChangeAccountStatusInput {
  actorId: string;
  audit: AccountStatusAudit;
  userId: string;
  op: AccountStatusOp;
  reason?: string | null;
  /** Obligatorio para `delete`: tiene que coincidir con el email de la cuenta. */
  confirmEmail?: string | null;
  now?: Date;
}

export type ChangeAccountStatusResult =
  | { ok: true; status: AccountStatus; bodaId: string | null }
  | { ok: false; error: AccountStatusError };

const TARGET: Record<AccountStatusOp, AccountStatus> = {
  suspend: "suspended",
  reactivate: "active",
  delete: "deleted",
  restore: "active",
};

const ALLOWED_FROM: Record<AccountStatusOp, AccountStatus[]> = {
  suspend: ["active"],
  reactivate: ["suspended"],
  delete: ["active", "suspended"],
  restore: ["deleted"],
};

const AUDIT_ACTION: Record<AccountStatusOp, string> = {
  suspend: "admin.user.suspended",
  reactivate: "admin.user.reactivated",
  delete: "admin.user.deleted",
  restore: "admin.user.restored",
};

export function isAccountStatusOp(value: unknown): value is AccountStatusOp {
  return ACCOUNT_STATUS_OPS.includes(value as AccountStatusOp);
}

function asRecord(value: unknown): Record<string, Prisma.InputJsonValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, Prisma.InputJsonValue>) }
    : {};
}

function cleanReason(reason: string | null | undefined): string | null {
  const value = String(reason ?? "").trim().slice(0, 500);
  return value || null;
}

/**
 * Suspender / reactivar / eliminar (baja lógica) / restaurar una cuenta desde el admin.
 * Todo en una transacción: estado, sessionVersion (corta sesiones), micrositio offline
 * recordando si estaba online, y entrada de auditoría. No borra filas ni archivos.
 */
export async function changeAccountStatus(
  db: PrismaClient,
  input: ChangeAccountStatusInput,
): Promise<ChangeAccountStatusResult> {
  const now = input.now ?? new Date();
  const reason = cleanReason(input.reason);
  const target = TARGET[input.op];

  if (input.userId === input.actorId && input.op !== "reactivate" && input.op !== "restore") {
    return { ok: false, error: "self" };
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        erasedAt: true,
        boda: { select: { id: true, slug: true, isOnline: true, options: true, misc: true } },
      },
    });
    if (!user) {
      return { ok: false, error: "not_found" } as const;
    }
    if (user.erasedAt) {
      return { ok: false, error: "erased" } as const;
    }

    const current = normalizeAccountStatus(user.status);
    if (!ALLOWED_FROM[input.op].includes(current)) {
      return { ok: false, error: "invalid_transition" } as const;
    }

    if (input.op === "delete") {
      const typed = String(input.confirmEmail ?? "").trim().toLowerCase();
      if (!typed || typed !== user.email.trim().toLowerCase()) {
        return { ok: false, error: "confirm_email" } as const;
      }
    }

    if ((input.op === "suspend" || input.op === "delete") && isAdminRole(user.role)) {
      const otherActiveAdmins = await tx.user.count({
        where: { role: ADMIN_ROLE, status: "active", id: { not: user.id } },
      });
      if (otherActiveAdmins === 0) {
        return { ok: false, error: "last_admin" } as const;
      }
    }

    const deactivating = target !== "active";
    await tx.user.update({
      where: { id: user.id },
      data: {
        status: target,
        statusChangedAt: now,
        statusReason: deactivating ? reason : null,
        deletedAt: target === "deleted" ? now : target === "active" ? null : undefined,
        ...(deactivating ? { sessionVersion: { increment: 1 } } : {}),
      },
    });

    let previousOnline: boolean | null = null;
    let restoredOnline: boolean | null = null;
    const boda = user.boda;
    if (boda) {
      const misc = asRecord(boda.misc);
      const options = asRecord(boda.options);
      if (deactivating) {
        // Si ya estaba suspendida y ahora se elimina, conservamos el valor original.
        if (!(PREV_ONLINE_MISC_KEY in misc)) {
          misc[PREV_ONLINE_MISC_KEY] = boda.isOnline;
        }
        previousOnline = Boolean(misc[PREV_ONLINE_MISC_KEY]);
        await tx.boda.update({
          where: { id: boda.id },
          data: { isOnline: false, options: { ...options, is_online: 0 }, misc },
        });
      } else {
        restoredOnline = misc[PREV_ONLINE_MISC_KEY] === true;
        delete misc[PREV_ONLINE_MISC_KEY];
        await tx.boda.update({
          where: { id: boda.id },
          data: {
            isOnline: restoredOnline,
            options: { ...options, is_online: restoredOnline ? 1 : 0 },
            misc,
          },
        });
      }
    }

    await tx.adminAuditLog.create({
      data: {
        actorUserId: input.audit.actorUserId,
        actorEmail: input.audit.actorEmail,
        action: AUDIT_ACTION[input.op],
        entity: "user",
        entityId: user.id,
        metadata: {
          previousStatus: current,
          newStatus: target,
          reason,
          bodaId: boda?.id ?? null,
          bodaSlug: boda?.slug ?? null,
          previousOnline,
          restoredOnline,
        },
        ipHash: input.audit.ipHash,
      },
    });

    return { ok: true, status: target, bodaId: boda?.id ?? null } as const;
  });
}