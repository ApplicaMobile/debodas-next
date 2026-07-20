"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import {
  encryptPaymentSettings,
  getPaymentSettings,
  type BodaPaymentSettings,
} from "@/lib/bodas/payment-settings";
import { prisma } from "@/lib/db/prisma";

function readPaymentSettings(formData: FormData): BodaPaymentSettings {
  return {
    mp_tokens: {
      public_key: String(formData.get("mp_public_key") ?? "").trim(),
      access_token: String(formData.get("mp_access_token") ?? "").trim(),
    },
    mp_alias_cvu: {
      owner_mp: String(formData.get("mp_transfer_owner") ?? "").trim(),
      alias_cvu_mp: String(formData.get("mp_transfer_alias") ?? "").trim(),
    },
    bank_account: {
      bank: String(formData.get("bank_name_ars") ?? "").trim(),
      cbu: String(formData.get("bank_cbu_ars") ?? "").trim(),
      owner: String(formData.get("bank_owner_ars") ?? "").trim(),
      alias: String(formData.get("bank_alias_ars") ?? "").trim(),
    },
    bank_account_usd: {
      bank: String(formData.get("bank_name_usd") ?? "").trim(),
      cbu: String(formData.get("bank_cbu_usd") ?? "").trim(),
      owner: String(formData.get("bank_owner_usd") ?? "").trim(),
    },
    paypal: {
      paypal_me: String(formData.get("paypal_me") ?? "").trim(),
      owner: String(formData.get("paypal_owner") ?? "").trim(),
    },
  };
}

export async function updatePaymentSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const misc = (boda.misc as Record<string, unknown>) ?? {};
  const previous = getPaymentSettings(misc);
  const paymentSettings = encryptPaymentSettings(
    readPaymentSettings(formData),
    previous,
  );

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        misc: {
          ...misc,
          payment_settings: paymentSettings,
        } as object,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/pagos", `/bodas/${boda.slug}`]);
    return { success: "Métodos de pago actualizados." };
  } catch (err) {
    console.error("[updatePaymentSettingsAction]", err);
    return { error: "No se pudieron guardar los métodos de pago." };
  }
}
