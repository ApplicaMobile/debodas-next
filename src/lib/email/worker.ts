import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  deliverEmail,
  EmailConfigurationError,
} from "@/lib/email/client";
import { decryptEmailContent } from "@/lib/email/crypto";

const LOCK_TIMEOUT_MS = 2 * 60 * 1000;
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

export interface EmailQueueStats {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  blocked: number;
}

function errorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : "Error SMTP desconocido";
  for (const secret of [
    process.env.SMTP_PASSWORD,
    process.env.SMTP_USER,
  ]) {
    if (secret?.trim()) {
      message = message.replaceAll(secret, "[oculto]");
    }
  }
  return message.replace(/\s+/g, " ").slice(0, 1000);
}

function smtpResponseCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const value = (error as { responseCode?: unknown }).responseCode;
  return typeof value === "number" ? value : null;
}

function smtpErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const value = (error as { code?: unknown }).code;
  return typeof value === "string" ? value : "";
}

function classifyFailure(
  error: unknown,
  attempts: number,
  maxAttempts: number,
): "blocked" | "failed" | "retry" {
  if (
    error instanceof EmailConfigurationError ||
    smtpErrorCode(error) === "EAUTH" ||
    smtpResponseCode(error) === 535
  ) {
    return "blocked";
  }
  const responseCode = smtpResponseCode(error);
  if (responseCode && responseCode >= 500 && responseCode < 600) {
    return "failed";
  }
  return attempts >= maxAttempts ? "failed" : "retry";
}

function nextAttemptAt(attempts: number): Date {
  const base = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
  const jitter = 0.8 + Math.random() * 0.4;
  return new Date(Date.now() + Math.round(base * jitter));
}

async function processJob(
  workerId: string,
  job: Awaited<ReturnType<typeof claimJobs>>[number],
): Promise<"sent" | "retried" | "failed" | "blocked"> {
  try {
    if (!job.contentEncrypted) {
      throw new Error("El email no tiene contenido reintentable");
    }
    const delivered = await deliverEmail({
      to: job.toAddress.split(",").map((email) => email.trim()),
      subject: job.subject,
      html: decryptEmailContent(job.contentEncrypted),
      replyTo: job.replyTo ?? undefined,
    });

    await prisma.$transaction(async (tx) => {
      const updated = await tx.emailLog.updateMany({
        where: { id: job.id, lockedBy: workerId, status: "processing" },
        data: {
          status: "sent",
          sentAt: new Date(),
          providerId: delivered.id,
          error: null,
          lockedAt: null,
          lockedBy: null,
        },
      });
      if (updated.count !== 1) return;

      const meta =
        job.meta && typeof job.meta === "object" && !Array.isArray(job.meta)
          ? (job.meta as Record<string, unknown>)
          : {};
      const bodaId = typeof meta.bodaId === "string" ? meta.bodaId : null;
      if (job.type === "rating_request" && bodaId) {
        await tx.boda.updateMany({
          where: { id: bodaId },
          data: { ratingEmailSentAt: new Date() },
        });
      }
    });
    return "sent";
  } catch (error) {
    const status = classifyFailure(error, job.attempts, job.maxAttempts);
    await prisma.emailLog.updateMany({
      where: { id: job.id, lockedBy: workerId, status: "processing" },
      data: {
        status,
        availableAt:
          status === "retry" ? nextAttemptAt(job.attempts) : job.availableAt,
        error: errorMessage(error),
        lockedAt: null,
        lockedBy: null,
      },
    });
    return status === "retry" ? "retried" : status;
  }
}

async function claimJobs(limit: number, workerId: string) {
  const staleBefore = new Date(Date.now() - LOCK_TIMEOUT_MS);
  await prisma.emailLog.updateMany({
    where: { status: "processing", lockedAt: { lt: staleBefore } },
    data: {
      status: "retry",
      availableAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      error: "Lock vencido; trabajo recuperado automáticamente.",
    },
  });

  const now = new Date();
  await prisma.$executeRaw`
    UPDATE email_logs
    SET status = 'processing',
        locked_by = ${workerId},
        locked_at = ${now},
        attempts = attempts + 1,
        updated_at = ${now}
    WHERE status IN ('queued', 'retry')
      AND available_at <= ${now}
      AND attempts < max_attempts
    ORDER BY available_at ASC, created_at ASC
    LIMIT ${limit}
  `;

  return prisma.emailLog.findMany({
    where: { lockedBy: workerId, status: "processing" },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function processEmailQueue(
  limit = 20,
): Promise<EmailQueueStats> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const workerId = randomUUID();
  const jobs = await claimJobs(safeLimit, workerId);
  const stats: EmailQueueStats = {
    claimed: jobs.length,
    sent: 0,
    retried: 0,
    failed: 0,
    blocked: 0,
  };

  for (let index = 0; index < jobs.length; index += 3) {
    const results = await Promise.all(
      jobs.slice(index, index + 3).map((job) => processJob(workerId, job)),
    );
    for (const result of results) stats[result] += 1;
  }
  return stats;
}
