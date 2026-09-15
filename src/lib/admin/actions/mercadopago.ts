"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getAdminAuditContext, writeAdminAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/require-admin";
import type { FormState } from "@/lib/account/form-state";
import { prisma } from "@/lib/db/prisma";
import {
  getMercadoPagoAccount,
  MercadoPagoApiError,
} from "@/lib/mercadopago/api";
import {
  getMercadoPagoAccessToken,
  invalidateMercadoPagoConfigCache,
  readStoredMercadoPagoSettings,
} from "@/lib/mercadopago/config";
import {
  applyMercadoPagoFormUpdate,
  MERCADOPAGO_SETTING_KEY,
  type MercadoPagoSandboxMode,
} from "@/lib/mercadopago/settings";

function readSandboxMode(value: string): MercadoPagoSandboxMode {
  if (value === "on" || value === "off") {
    return value;
  }
  return "auto";
}

function looksMasked(value: string): boolean {
  return value.includes("•");
}

export async function updateMercadoPagoSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const previous = await readStoredMercadoPagoSettings();
  const next = applyMercadoPagoFormUpdate(previous, {
    accessToken: String(formData.get("mp_access_token") ?? ""),
    publicKey: String(formData.get("mp_public_key") ?? ""),
    webhookSecret: String(formData.get("mp_webhook_secret") ?? ""),
    sandboxMode: readSandboxMode(String(formData.get("mp_sandbox") ?? "auto")),
    webhookStrict: formData.get("mp_webhook_strict") === "1",
    clearAccessToken: formData.get("clear_access_token") === "1",
    clearWebhookSecret: formData.get("clear_webhook_secret") === "1",
  });

  const audit = await getAdminAuditContext(admin);
  try {
    await prisma.$transaction(async (tx) => {
      const value = next as Prisma.InputJsonValue;
      await tx.systemSetting.upsert({
        where: { key: MERCADOPAGO_SETTING_KEY },
        create: { key: MERCADOPAGO_SETTING_KEY, value },
        update: { value },
      });
      await writeAdminAudit(tx, audit, {
        action: "admin.mercadopago.settings_updated",
        entity: "mercadopago",
        metadata: {
          hasAccessToken: Boolean(next.accessToken),
          hasPublicKey: Boolean(next.publicKey),
          hasWebhookSecret: Boolean(next.webhookSecret),
          sandbox: next.sandbox,
          webhookStrict: next.webhookStrict ?? false,
        },
      });
    });
  } catch (error) {
    console.error("[updateMercadoPagoSettingsAction]", error);
    return {
      error:
        "No se pudo guardar la configuración. ¿Corriste prisma db push?",
    };
  }

  invalidateMercadoPagoConfigCache();
  revalidatePath("/admin/mercadopago");
  revalidatePath("/admin/estado");
  revalidatePath("/admin");
  revalidatePath("/mi-cuenta/plan");

  return { success: "Configuración de MercadoPago guardada." };
}

export async function testMercadoPagoConnectionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const typed = String(formData.get("mp_access_token") ?? "").trim();
  const token =
    typed && !looksMasked(typed)
      ? typed
      : await getMercadoPagoAccessToken();

  if (!token) {
    return {
      error:
        "No hay Access Token para probar. Pegá uno o guardalo primero.",
    };
  }

  try {
    const account = await getMercadoPagoAccount(token);
    const who =
      account.nickname ||
      account.email ||
      (account.id ? `ID ${account.id}` : "cuenta válida");
    const site = account.site_id ? ` · ${account.site_id}` : "";
    return {
      success: `Conexión OK: ${who}${site}. Ya se pueden crear checkouts.`,
    };
  } catch (error) {
    if (error instanceof MercadoPagoApiError) {
      return { error: `MercadoPago rechazó el token: ${error.message}` };
    }
    console.error("[testMercadoPagoConnectionAction]", error);
    return { error: "No se pudo contactar a MercadoPago." };
  }
}
