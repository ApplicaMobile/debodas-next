import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { encryptEmailContent } from "@/lib/email/crypto";

export interface EnqueueEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  type?: string;
  dedupeKey?: string;
  meta?: Record<string, unknown>;
  maxAttempts?: number;
}

export type EnqueueEmailResult =
  | { skipped: true }
  | { skipped: false; queued: true; id: string; duplicate?: boolean };

function wakeEmailWorker(): void {
  if (process.env.EMAIL_QUEUE_AUTO_PROCESS?.trim() === "false") return;
  void import("@/lib/email/worker")
    .then(({ processEmailQueue }) => processEmailQueue(5))
    .catch((error) => console.error("[email queue wake]", error));
}

export async function enqueueEmail(
  input: EnqueueEmailInput,
): Promise<EnqueueEmailResult> {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (recipients.length === 0) {
    return { skipped: true };
  }

  try {
    const job = await prisma.emailLog.create({
      data: {
        type: input.type ?? "generic",
        dedupeKey: input.dedupeKey?.trim() || null,
        toAddress: recipients.join(", "),
        replyTo: input.replyTo?.trim() || null,
        subject: input.subject,
        contentEncrypted: encryptEmailContent(input.html),
        status: "queued",
        maxAttempts: input.maxAttempts ?? 5,
        meta: (input.meta ?? {}) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    wakeEmailWorker();
    return { skipped: false, queued: true, id: job.id };
  } catch (error) {
    if (
      input.dedupeKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.emailLog.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: { id: true, status: true },
      });
      if (existing) {
        if (["queued", "retry"].includes(existing.status)) {
          wakeEmailWorker();
        }
        return {
          skipped: false,
          queued: true,
          id: existing.id,
          duplicate: true,
        };
      }
    }
    throw error;
  }
}
