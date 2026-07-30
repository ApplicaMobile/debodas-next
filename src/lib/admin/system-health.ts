import { isEmailConfigured } from "@/lib/email/client";
import {
  isMercadoPagoConfigured,
  isMercadoPagoSandbox,
} from "@/lib/mercadopago/config";
import { prisma } from "@/lib/db/prisma";
import { usesCloudStorage } from "@/lib/upload/local";
import { CRON_HEARTBEAT_IDS } from "@/lib/admin/cron-heartbeat";

export type HealthLevel = "ok" | "warn" | "error" | "unknown";

export interface HealthCheck {
  id: string;
  label: string;
  level: HealthLevel;
  summary: string;
  detail?: string;
  href?: string;
}

export interface SystemAlert {
  id: string;
  level: "warn" | "error";
  message: string;
  href?: string;
}

export interface SystemHealthReport {
  checkedAt: Date;
  checks: HealthCheck[];
  alerts: SystemAlert[];
  overall: HealthLevel;
}

const EMAIL_QUEUE_STALE_MS = 15 * 60 * 1000;
const RATING_CRON_STALE_MS = 36 * 60 * 60 * 1000;
const MAINTENANCE_CRON_STALE_MS = 36 * 60 * 60 * 1000;
const QUEUED_STALE_MS = 15 * 60 * 1000;

function worstLevel(levels: HealthLevel[]): HealthLevel {
  if (levels.includes("error")) return "error";
  if (levels.includes("warn")) return "warn";
  if (levels.includes("unknown")) return "unknown";
  return "ok";
}

function formatAge(ms: number | null): string {
  if (ms === null) return "nunca";
  if (ms < 60_000) return `hace ${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `hace ${Math.round(ms / 60_000)} min`;
  if (ms < 86_400_000) return `hace ${Math.round(ms / 3_600_000)} h`;
  return `hace ${Math.round(ms / 86_400_000)} d`;
}

export function evaluateCronFreshness(
  lastRunAt: Date | null,
  maxAgeMs: number,
  now = new Date(),
): { level: HealthLevel; ageMs: number | null } {
  if (!lastRunAt) {
    return { level: "unknown", ageMs: null };
  }
  const ageMs = now.getTime() - lastRunAt.getTime();
  if (ageMs > maxAgeMs) {
    return { level: "warn", ageMs };
  }
  return { level: "ok", ageMs };
}

export async function getSystemHealthReport(): Promise<SystemHealthReport> {
  const checkedAt = new Date();
  const checks: HealthCheck[] = [];
  const alerts: SystemAlert[] = [];

  let databaseOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
    checks.push({
      id: "database",
      label: "MariaDB",
      level: "ok",
      summary: "Conexión activa",
      detail: "SELECT 1 respondió correctamente.",
    });
  } catch (error) {
    checks.push({
      id: "database",
      label: "MariaDB",
      level: "error",
      summary: "Sin conexión",
      detail:
        error instanceof Error
          ? error.message
          : "No se pudo consultar la base de datos.",
    });
    alerts.push({
      id: "database-down",
      level: "error",
      message: "MariaDB no responde. Revisá XAMPP o DATABASE_URL.",
    });
  }

  const smtpConfigured = isEmailConfigured();
  const emailTestTo = process.env.EMAIL_TEST_TO?.trim();
  if (!smtpConfigured) {
    checks.push({
      id: "smtp",
      label: "SMTP",
      level: "warn",
      summary: "Sin credenciales",
      detail: "Los emails quedan en cola o se bloquean al procesar.",
      href: "/admin/emails",
    });
    alerts.push({
      id: "smtp-missing",
      level: "warn",
      message: "SMTP no configurado: no se enviarán emails reales.",
      href: "/admin/emails",
    });
  } else if (emailTestTo) {
    checks.push({
      id: "smtp",
      label: "SMTP",
      level: "warn",
      summary: "Modo prueba activo",
      detail: `EMAIL_TEST_TO redirige todos los envíos a ${emailTestTo}.`,
      href: "/admin/emails",
    });
    alerts.push({
      id: "smtp-test-mode",
      level: "warn",
      message: "EMAIL_TEST_TO está definido: no enviar a destinatarios reales.",
      href: "/admin/emails",
    });
  } else {
    checks.push({
      id: "smtp",
      label: "SMTP",
      level: "ok",
      summary: "Configurado",
      detail: `Host ${process.env.SMTP_HOST?.trim() ?? "—"}`,
      href: "/admin/emails",
    });
  }

  if (databaseOk) {
    const [
      queued,
      failed,
      blocked,
      processing,
      oldestQueued,
      emailQueueBeat,
      ratingBeat,
      maintenanceBeat,
    ] = await Promise.all([
      prisma.emailLog.count({
        where: { status: { in: ["queued", "retry"] } },
      }),
      prisma.emailLog.count({ where: { status: "failed" } }),
      prisma.emailLog.count({ where: { status: "blocked" } }),
      prisma.emailLog.count({ where: { status: "processing" } }),
      prisma.emailLog.findFirst({
        where: {
          status: { in: ["queued", "retry"] },
          availableAt: { lte: checkedAt },
        },
        orderBy: { availableAt: "asc" },
        select: { availableAt: true, createdAt: true },
      }),
      prisma.systemHeartbeat.findUnique({
        where: { id: CRON_HEARTBEAT_IDS.emailQueue },
      }),
      prisma.systemHeartbeat.findUnique({
        where: { id: CRON_HEARTBEAT_IDS.ratingEmails },
      }),
      prisma.systemHeartbeat.findUnique({
        where: { id: CRON_HEARTBEAT_IDS.maintenance },
      }),
    ]);

    const queueProblems = failed + blocked;
    let queueLevel: HealthLevel = "ok";
    let queueSummary = `${queued} en cola`;
    if (queueProblems > 0) {
      queueLevel = "warn";
      queueSummary = `${queued} en cola · ${failed} fallidos · ${blocked} bloqueados`;
      alerts.push({
        id: "email-problems",
        level: "warn",
        message: `Hay ${failed} emails fallidos y ${blocked} bloqueados.`,
        href: "/admin/emails?status=failed",
      });
    }

    const oldestReadyAt = oldestQueued?.availableAt ?? null;
    if (
      oldestReadyAt &&
      checkedAt.getTime() - oldestReadyAt.getTime() > QUEUED_STALE_MS
    ) {
      queueLevel = worstLevel([queueLevel, "warn"]);
      alerts.push({
        id: "email-stale-queue",
        level: "warn",
        message:
          "Hay emails listos hace más de 15 minutos sin procesar. Revisá el cron de cola.",
        href: "/admin/emails?status=queued",
      });
    }

    checks.push({
      id: "email-queue",
      label: "Cola de emails",
      level: queueLevel,
      summary: queueSummary,
      detail: `${processing} en proceso. Cron email-queue cada 5 min.`,
      href: "/admin/emails",
    });

    const emailCron = evaluateCronFreshness(
      emailQueueBeat?.lastRunAt ?? null,
      EMAIL_QUEUE_STALE_MS,
      checkedAt,
    );
    checks.push({
      id: "cron-email-queue",
      label: "Cron cola emails",
      level: emailCron.level,
      summary: formatAge(emailCron.ageMs),
      detail:
        emailCron.level === "unknown"
          ? "Todavía no hay registros de ejecución."
          : emailCron.level === "warn"
            ? "Atrasado respecto del schedule de 5 minutos."
            : "Heartbeat reciente.",
      href: "/admin/estado",
    });
    if (emailCron.level === "warn") {
      alerts.push({
        id: "cron-email-stale",
        level: "warn",
        message: "El cron de cola de emails parece atrasado (>15 min).",
        href: "/admin/estado",
      });
    }

    const ratingCron = evaluateCronFreshness(
      ratingBeat?.lastRunAt ?? null,
      RATING_CRON_STALE_MS,
      checkedAt,
    );
    checks.push({
      id: "cron-rating-emails",
      label: "Cron calificaciones",
      level: ratingCron.level === "warn" ? "warn" : ratingCron.level,
      summary: formatAge(ratingCron.ageMs),
      detail:
        ratingCron.level === "unknown"
          ? "Todavía no hay registros (schedule diario 12:00 UTC)."
          : ratingCron.level === "warn"
            ? "Sin ejecución reciente (>36 h)."
            : "Heartbeat dentro de la ventana esperada.",
      href: "/admin/estado",
    });
    if (ratingCron.level === "warn") {
      alerts.push({
        id: "cron-rating-stale",
        level: "warn",
        message: "El cron de emails de calificación está atrasado.",
        href: "/admin/estado",
      });
    }

    const maintenanceCron = evaluateCronFreshness(
      maintenanceBeat?.lastRunAt ?? null,
      MAINTENANCE_CRON_STALE_MS,
      checkedAt,
    );
    checks.push({
      id: "cron-maintenance",
      label: "Cron mantenimiento",
      level: maintenanceCron.level === "warn" ? "warn" : maintenanceCron.level,
      summary: formatAge(maintenanceCron.ageMs),
      detail:
        maintenanceCron.level === "unknown"
          ? "Todavía no hay registros (schedule diario 04:15 UTC)."
          : maintenanceCron.level === "warn"
            ? "Sin ejecución reciente (>36 h)."
            : "Heartbeat dentro de la ventana esperada.",
      href: "/admin/estado",
    });
    if (maintenanceCron.level === "warn") {
      alerts.push({
        id: "cron-maintenance-stale",
        level: "warn",
        message: "El cron de mantenimiento está atrasado.",
        href: "/admin/estado",
      });
    }
  } else {
    checks.push({
      id: "email-queue",
      label: "Cola de emails",
      level: "unknown",
      summary: "No disponible",
      detail: "Requiere MariaDB.",
      href: "/admin/emails",
    });
    checks.push({
      id: "cron-email-queue",
      label: "Cron cola emails",
      level: "unknown",
      summary: "No disponible",
    });
    checks.push({
      id: "cron-rating-emails",
      label: "Cron calificaciones",
      level: "unknown",
      summary: "No disponible",
    });
    checks.push({
      id: "cron-maintenance",
      label: "Cron mantenimiento",
      level: "unknown",
      summary: "No disponible",
    });
  }

  const cloudStorage = usesCloudStorage();
  checks.push({
    id: "storage",
    label: "Storage",
    level: cloudStorage ? "ok" : "warn",
    summary: cloudStorage ? "Vercel Blob" : "Uploads locales",
    detail: cloudStorage
      ? "BLOB_READ_WRITE_TOKEN configurado."
      : "Sin Blob: los archivos en public/uploads no persisten en Vercel.",
  });
  if (!cloudStorage) {
    alerts.push({
      id: "storage-local",
      level: "warn",
      message: "Storage local activo. En producción conviene Vercel Blob.",
    });
  }

  const mpConfigured = isMercadoPagoConfigured();
  const mpSandbox = isMercadoPagoSandbox();
  if (!mpConfigured) {
    checks.push({
      id: "mercadopago",
      label: "MercadoPago",
      level: "warn",
      summary: "Sin access token",
      detail: "Los checkouts de plan/regalo con MP no funcionarán.",
      href: "/admin/pagos",
    });
    alerts.push({
      id: "mp-missing",
      level: "warn",
      message: "MercadoPago no está configurado.",
      href: "/admin/pagos",
    });
  } else {
    checks.push({
      id: "mercadopago",
      label: "MercadoPago",
      level: mpSandbox ? "warn" : "ok",
      summary: mpSandbox ? "Sandbox / TEST" : "Producción",
      detail: mpSandbox
        ? "MERCADOPAGO_SANDBOX o token TEST- activo."
        : "Token de producción detectado.",
      href: "/admin/pagos",
    });
    if (mpSandbox) {
      alerts.push({
        id: "mp-sandbox",
        level: "warn",
        message: "MercadoPago está en modo sandbox/TEST.",
        href: "/admin/pagos",
      });
    }

    const webhookSecret = Boolean(
      process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim(),
    );
    checks.push({
      id: "mercadopago-webhook",
      label: "Webhook MP",
      level: webhookSecret ? "ok" : "warn",
      summary: webhookSecret ? "Secret configurado" : "Sin secret",
      detail: webhookSecret
        ? "Se valida x-signature cuando MP la envía."
        : "Agregá MERCADOPAGO_WEBHOOK_SECRET (panel MP → Webhooks).",
      href: "/admin/pagos",
    });
    if (!webhookSecret) {
      alerts.push({
        id: "mp-webhook-secret",
        level: "warn",
        message:
          "Falta MERCADOPAGO_WEBHOOK_SECRET: el webhook no puede verificar firmas.",
        href: "/admin/pagos",
      });
    }
  }

  const cronSecret = Boolean(process.env.CRON_SECRET?.trim());
  checks.push({
    id: "cron-secret",
    label: "CRON_SECRET",
    level: cronSecret ? "ok" : "error",
    summary: cronSecret ? "Definido" : "Falta",
    detail: cronSecret
      ? "Los endpoints /api/cron/* pueden autenticarse."
      : "Sin CRON_SECRET los crons rechazan todas las llamadas.",
  });
  if (!cronSecret) {
    alerts.push({
      id: "cron-secret-missing",
      level: "error",
      message: "Falta CRON_SECRET: los crons no pueden autenticarse.",
    });
  }

  return {
    checkedAt,
    checks,
    alerts,
    overall: worstLevel(checks.map((c) => c.level)),
  };
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  const report = await getSystemHealthReport();
  return report.alerts;
}
