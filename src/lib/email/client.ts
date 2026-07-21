import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  const parsedPort = Number(process.env.SMTP_PORT);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 465;
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureValue === "true" || (secureValue !== "false" && port === 465);

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    authMethod: "LOGIN" as const,
  };
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const config = getSmtpConfig();
  if (!config) {
    return null;
  }
  transporter ??= nodemailer.createTransport(config);
  return transporter;
}

export function isEmailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    `DeBodas <${process.env.SMTP_USER?.trim() || "consultas@debodas.com.ar"}>`
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
  const requestedRecipients = to
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (requestedRecipients.length === 0) {
    return { skipped: true };
  }

  const testRecipient = process.env.EMAIL_TEST_TO?.trim().toLowerCase();
  const recipients = testRecipient ? [testRecipient] : requestedRecipients;
  const emailMeta = testRecipient
    ? {
        ...(input.meta ?? {}),
        testRedirect: true,
        originalRecipients: requestedRecipients,
      }
    : input.meta;
  const deliverySubject = testRecipient
    ? `[PRUEBA] ${input.subject}`
    : input.subject;

  if (testRecipient) {
    console.info(
      `[email] prueba redirigida ${requestedRecipients.join(", ")} → ${testRecipient}`,
    );
  }

  const smtp = getTransporter();
  if (!smtp) {
    console.warn(
      `[email] SMTP incompleto — simulado "${deliverySubject}" → ${recipients.join(", ")}`,
    );
    await logEmail({
      to: recipients,
      subject: deliverySubject,
      status: "skipped",
      meta: { ...(emailMeta ?? {}), reason: "missing_smtp_config" },
    });
    return { skipped: true, simulated: true };
  }

  try {
    const info = await smtp.sendMail({
      from: getFromAddress(),
      to: recipients,
      subject: deliverySubject,
      html: input.html,
      replyTo: input.replyTo,
    });

    await logEmail({
      to: recipients,
      subject: deliverySubject,
      status: "sent",
      providerId: info.messageId,
      meta: emailMeta,
    });

    return { skipped: false, id: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    await logEmail({
      to: recipients,
      subject: deliverySubject,
      status: "failed",
      error: message,
      meta: emailMeta,
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
