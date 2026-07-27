"use server";

import { headers } from "next/headers";
import type { FormState } from "@/lib/account/form-state";
import { getAdminEmail } from "@/lib/email/client";
import { enqueueEmail } from "@/lib/email/queue";
import { contactFormEmail } from "@/lib/email/templates";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

const MAX_NAME = 120;
const MAX_MESSAGE = 4000;

export async function submitContactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { success: "Mensaje enviado con éxito. ¡Gracias por contactarnos!" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || name.length > MAX_NAME) {
    return { error: "Ingresá un nombre válido." };
  }
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresá un email válido." };
  }
  if (message.length < 5) {
    return { error: "Escribí un mensaje un poco más largo." };
  }
  if (message.length > MAX_MESSAGE) {
    return { error: "El mensaje es demasiado largo." };
  }

  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`contact:ip:${ip}`, 5, 60 * 60 * 1000),
    checkRateLimit(`contact:email:${email}`, 3, 60 * 60 * 1000),
  ]);
  const limited = !ipLimit.ok ? ipLimit : emailLimit;
  if (!limited.ok) {
    return {
      error: `Demasiados mensajes. Probá de nuevo en ${limited.retryAfterSec}s.`,
    };
  }

  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    return {
      error:
        "No pudimos enviar el mensaje ahora. Escribinos a hola@debodas.com.ar.",
    };
  }

  const mail = contactFormEmail({ name, email, message });

  try {
    await enqueueEmail({
      to: adminEmail,
      subject: mail.subject,
      html: mail.html,
      replyTo: email,
      type: "contact",
      meta: { name, email },
    });
  } catch (err) {
    console.error("[submitContactAction]", err);
    return {
      error:
        "No pudimos enviar el mensaje ahora. Escribinos a hola@debodas.com.ar.",
    };
  }

  return {
    success: "Mensaje enviado con éxito. ¡Gracias por contactarnos!",
  };
}
