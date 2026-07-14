"use server";

import { isThemeSlug } from "@/lib/themes/registry";
import { requireOwnedBoda } from "@/lib/account/auth-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { canUseTheme } from "@/lib/plans/features";
import { getTheme } from "@/lib/themes/registry";
import { prisma } from "@/lib/db/prisma";
import type { FormState } from "@/lib/account/form-state";

export async function updateThemeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const themeSlug = String(formData.get("microsite_theme") ?? "").trim();
  if (!isThemeSlug(themeSlug)) {
    return { error: "Tema no válido." };
  }

  const theme = getTheme(themeSlug);
  if (!canUseTheme(boda.plan, theme.plan)) {
    return {
      error: `El tema "${theme.label}" requiere un plan superior.`,
    };
  }

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: { micrositeTheme: themeSlug },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/tema", `/bodas/${boda.slug}`]);
    return { success: `Tema "${theme.label}" aplicado.` };
  } catch (err) {
    console.error("[updateThemeAction]", err);
    return { error: "No se pudo cambiar el tema." };
  }
}
