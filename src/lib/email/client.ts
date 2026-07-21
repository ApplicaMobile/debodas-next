import nodemailer from "nodemailer";

export class EmailConfigurationError extends Error {}

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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
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

export async function deliverEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ id: string; recipients: string[]; subject: string }> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const requestedRecipients = to
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (requestedRecipients.length === 0) {
    throw new Error("El email no tiene destinatarios válidos");
  }

  const testRecipient = process.env.EMAIL_TEST_TO?.trim().toLowerCase();
  const recipients = testRecipient ? [testRecipient] : requestedRecipients;
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
    throw new EmailConfigurationError("La configuración SMTP está incompleta");
  }

  const info = await smtp.sendMail({
    from: getFromAddress(),
    to: recipients,
    subject: deliverySubject,
    html: input.html,
    replyTo: input.replyTo,
  });

  return {
    id: info.messageId,
    recipients,
    subject: deliverySubject,
  };
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
