export interface MaintenanceRetentionConfig {
  emailLogDays: number;
  auditLogDays: number;
}

export interface MaintenanceStats {
  rateLimitBucketsDeleted: number;
  emailLogsDeleted: number;
  auditLogsDeleted: number;
  passwordResetTokensDeleted: number;
  emailLogRetentionDays: number;
  auditLogRetentionDays: number;
}

const DEFAULT_EMAIL_LOG_DAYS = 90;
const DEFAULT_AUDIT_LOG_DAYS = 180;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }
  return Math.floor(value);
}

export function getMaintenanceRetentionConfig(
  env: NodeJS.ProcessEnv = process.env,
): MaintenanceRetentionConfig {
  return {
    emailLogDays: parsePositiveInt(
      env.EMAIL_LOG_RETENTION_DAYS,
      DEFAULT_EMAIL_LOG_DAYS,
    ),
    auditLogDays: parsePositiveInt(
      env.AUDIT_LOG_RETENTION_DAYS,
      DEFAULT_AUDIT_LOG_DAYS,
    ),
  };
}

export function retentionCutoff(days: number, now = new Date()): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
