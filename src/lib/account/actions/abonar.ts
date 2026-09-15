"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { parseMisc } from "@/lib/account/require-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { prisma } from "@/lib/db/prisma";

export async function updateAbonarTarjetaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const titulo = String(formData.get("titulo_abonar_tarjeta") ?? "").trim();
  const valor = String(formData.get("valor_referencia_tarjeta") ?? "").trim();
  const texto = String(formData.get("texto_monto_tarjeta") ?? "").trim();

  if (titulo.length > 80 || valor.length > 40 || texto.length > 300) {
    return { error: "Uno de los campos de Abonar tarjeta es demasiado largo." };
  }

  const misc = parseMisc(boda.misc);
  const previous = Array.isArray(misc.tarjeta_pagos) ? misc.tarjeta_pagos : [];

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        misc: {
          ...misc,
          abonar_tarjeta: {
            titulo,
            valor_referencia: valor,
            texto_monto: texto,
          },
          tarjeta_pagos: previous,
        },
      },
    });
    revalidateBodaPaths(boda.slug, ["/mi-cuenta/boda", "/mi-cuenta/invitados"]);
    return { success: "Abonar tarjeta actualizado." };
  } catch (err) {
    console.error("[updateAbonarTarjetaAction]", err);
    return { error: "No se pudo guardar Abonar tarjeta." };
  }
}
