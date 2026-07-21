import { createHmac } from "crypto";
import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { clientIpFromHeaders } from "@/lib/security/rate-limit";

interface AuditActor {
  id: string;
  email: string;
}

export interface AdminAuditContext {
  actorUserId: string;
  actorEmail: string;
  ipHash: string | null;
}

export interface AdminAuditEvent {
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

function hashIp(ip: string): string | null {
  if (!ip || ip === "unknown") {
    return null;
  }
  const secret =
    process.env.AUDIT_IP_SECRET?.trim() ||
    process.env.RATE_LIMIT_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return null;
  }
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function getAdminAuditContext(
  actor: AuditActor,
): Promise<AdminAuditContext> {
  const headerStore = await headers();
  return {
    actorUserId: actor.id,
    actorEmail: actor.email,
    ipHash: hashIp(clientIpFromHeaders(headerStore)),
  };
}

export async function writeAdminAudit(
  tx: Prisma.TransactionClient,
  context: AdminAuditContext,
  event: AdminAuditEvent,
): Promise<void> {
  await tx.adminAuditLog.create({
    data: {
      actorUserId: context.actorUserId,
      actorEmail: context.actorEmail,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId ?? null,
      metadata: event.metadata ?? {},
      ipHash: context.ipHash,
    },
  });
}
