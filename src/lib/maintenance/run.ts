import { prisma } from "@/lib/db/prisma";
import {
  getMaintenanceRetentionConfig,
  retentionCutoff,
  type MaintenanceStats,
} from "@/lib/maintenance/config";

const TERMINAL_EMAIL_STATUSES = [
  "sent",
  "failed",
  "blocked",
  "skipped",
  "cancelled",
] as const;

export async function runMaintenance(
  now = new Date(),
): Promise<MaintenanceStats> {
  const retention = getMaintenanceRetentionConfig();
  const emailCutoff = retentionCutoff(retention.emailLogDays, now);
  const auditCutoff = retentionCutoff(retention.auditLogDays, now);

  const [
    rateLimits,
    emailLogs,
    auditLogs,
    passwordTokens,
  ] = await Promise.all([
    prisma.rateLimitBucket.deleteMany({
      where: { resetAt: { lt: now } },
    }),
    prisma.emailLog.deleteMany({
      where: {
        status: { in: [...TERMINAL_EMAIL_STATUSES] },
        createdAt: { lt: emailCutoff },
      },
    }),
    prisma.adminAuditLog.deleteMany({
      where: { createdAt: { lt: auditCutoff } },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          {
            AND: [
              { usedAt: { not: null } },
              { usedAt: { lt: emailCutoff } },
            ],
          },
        ],
      },
    }),
  ]);

  return {
    rateLimitBucketsDeleted: rateLimits.count,
    emailLogsDeleted: emailLogs.count,
    auditLogsDeleted: auditLogs.count,
    passwordResetTokensDeleted: passwordTokens.count,
    emailLogRetentionDays: retention.emailLogDays,
    auditLogRetentionDays: retention.auditLogDays,
  };
}
