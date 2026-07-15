"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { parseDressCodeFromForm } from "@/lib/bodas/dress-code";
import { prisma } from "@/lib/db/prisma";

function parseOptions(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return { ...(raw as Record<string, unknown>) };
}

export async function updateDressCodeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const dressCode = parseDressCodeFromForm(formData);
  const showDressCode = formData.get("show_dress_code") === "on" ? 1 : 0;
  const misc = (boda.misc as Record<string, unknown>) ?? {};
  const options = {
    ...parseOptions(boda.options),
    show_dress_code: showDressCode,
  };

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        misc: {
          ...misc,
          dress_code: dressCode,
        } as object,
        options,
      },
    });

    revalidateBodaPaths(boda.slug, [
      "/mi-cuenta/dress-code",
      "/mi-cuenta/plan",
      `/bodas/${boda.slug}`,
    ]);
    return { success: "Dress code actualizado." };
  } catch (err) {
    console.error("[updateDressCodeAction]", err);
    return { error: "No se pudo guardar el dress code." };
  }
}
