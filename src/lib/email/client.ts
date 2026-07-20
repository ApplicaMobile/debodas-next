import { Resend } from "resend";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() || "DeBodas <onboarding@resend.dev>"
  );
}

async function logEmail(input: {
  to: string[];
  subject: string;
  status: "sent" | "skipped" | "failed";
  providerId?: string;
  error?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        toAddress: input.to.join(", "),
        subject: input.subject,
        status: input.status,
        providerId: input.providerId ?? null,
        error: input.error ?? null,
        meta: (input.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("[email] failed to write EmailLog", error);
  }
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  meta?: Record<string, unknown>;
}): Promise<{ skipped: boolean; id?: string; simulated?: boolean }> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const recipients = to.map((e) => e.trim().toLowerCase()).filter(Boolean);

  if (recipients.length === 0) {
    return { skipped: true };
  }

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY missing — simulado "${input.subject}" → ${recipients.join(", ")}`,
    );
    await logEmail({
      to: recipients,
      subject: input.subject,
      status: "skipped",
      meta: { ...(input.meta ?? {}), reason: "missing_resend_api_key" },
    });
    return { skipped: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: recipients,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });

    if (error) {
      await logEmail({
        to: recipients,
        subject: input.subject,
        status: "failed",
        error: error.message,
        meta: input.meta,
      });
      console.error("[email] send failed:", error);
      throw new Error(error.message);
    }

    await logEmail({
      to: recipients,
      subject: input.subject,
      status: "sent",
      providerId: data?.id,
      meta: input.meta,
    });

    return { skipped: false, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    await logEmail({
      to: recipients,
      subject: input.subject,
      status: "failed",
      error: message,
      meta: input.meta,
    });
    throw error;
  }
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function getAdminEmail(): string | null {
  const email = process.env.EMAIL_ADMIN?.trim();
  return email || null;
}
