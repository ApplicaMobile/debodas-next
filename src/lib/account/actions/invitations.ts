"use server";

import { randomUUID } from "crypto";
import { requireOwnedBoda } from "@/lib/account/auth-boda";
import type { FormState } from "@/lib/account/form-state";
import { parseMisc } from "@/lib/account/require-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { parseInvitations } from "@/lib/invitations/parse";
import { isInvitationThemeSlug } from "@/lib/invitations/themes";
import {
  INVITATION_OUTFITS,
  MAX_INVITATIONS,
  type DigitalInvitation,
  type InvitationOutfit,
} from "@/lib/invitations/types";
import { normalizePlan } from "@/lib/plans/features";
import { prisma } from "@/lib/db/prisma";

function isOutfit(value: string): value is InvitationOutfit {
  return (INVITATION_OUTFITS as readonly string[]).includes(value);
}

function isPremiumPlan(plan: string): boolean {
  return normalizePlan(plan) === "premium";
}

export async function saveInvitationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const invitationId = String(formData.get("invitation_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const datetime = String(formData.get("datetime") ?? "").trim();
  const outfitRaw = String(formData.get("outfit") ?? "formal").trim();
  const locationName = String(formData.get("location_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const lat = String(formData.get("lat") ?? "").trim();
  const lng = String(formData.get("lng") ?? "").trim();
  const isVisible = formData.get("is_visible_in_microsite") === "on";

  if (!name || !title || !datetime) {
    return { error: "Completá nombre, título y fecha/hora." };
  }

  if (!isInvitationThemeSlug(theme)) {
    return { error: "Elegí un tema válido para la tarjeta." };
  }

  const outfit = isOutfit(outfitRaw) ? outfitRaw : "formal";
  const premium = isPremiumPlan(boda.plan);
  const cleanDescription =
    description.trim().toLowerCase() === title.trim().toLowerCase()
      ? ""
      : description;

  const misc = parseMisc(boda.misc);
  const invitations = parseInvitations(misc);
  const isEdit = Boolean(invitationId);

  if (isEdit) {
    const index = invitations.findIndex((item) => item.id === invitationId);
    if (index < 0) {
      return { error: "No encontramos esa invitación." };
    }
  } else if (invitations.length >= MAX_INVITATIONS) {
    return {
      error: `Podés crear hasta ${MAX_INVITATIONS} invitaciones digitales.`,
    };
  }

  const location = premium
    ? { address, lat, lng }
    : { address: "", lat: "", lng: "" };

  const nextInvitation = (() => {
    if (isEdit) {
      const current = invitations.find((item) => item.id === invitationId);
      if (!current) {
        return null;
      }
      return {
        ...current,
        name,
        title,
        description: cleanDescription,
        theme,
        datetime: datetime.slice(0, 16),
        outfit,
        locationName,
        location,
        isVisibleInMicrosite: isVisible,
      } satisfies DigitalInvitation;
    }

    return {
      id: randomUUID(),
      name,
      title,
      description: cleanDescription,
      theme,
      datetime: datetime.slice(0, 16),
      outfit,
      locationName,
      location,
      isVisibleInMicrosite: isVisible,
      createdAt: new Date().toISOString(),
    } satisfies DigitalInvitation;
  })();

  if (!nextInvitation) {
    return { error: "No encontramos esa invitación." };
  }

  const nextList = isEdit
    ? invitations.map((item) =>
        item.id === invitationId ? nextInvitation : item,
      )
    : [...invitations, nextInvitation];

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        misc: {
          ...misc,
          invitations: nextList,
        } as object,
      },
    });

    revalidateBodaPaths(boda.slug, [
      "/mi-cuenta/invitar",
      `/bodas/${boda.slug}`,
    ]);
    return {
      success: isEdit ? "Invitación actualizada." : "Invitación creada.",
    };
  } catch (err) {
    console.error("[saveInvitationAction]", err);
    return { error: "No se pudo guardar la invitación." };
  }
}

/** Alias de create; preferí saveInvitationAction. */
export async function addInvitationAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveInvitationAction(prev, formData);
}

export async function deleteInvitationAction(formData: FormData): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const invitationId = String(formData.get("invitation_id") ?? "").trim();
  if (!invitationId) {
    return;
  }

  const misc = parseMisc(boda.misc);
  const invitations = parseInvitations(misc).filter(
    (item) => item.id !== invitationId,
  );

  await prisma.boda.update({
    where: { id: boda.id },
    data: {
      misc: {
        ...misc,
        invitations,
      } as object,
    },
  });

  revalidateBodaPaths(boda.slug, [
    "/mi-cuenta/invitar",
    `/bodas/${boda.slug}`,
  ]);
}

export async function saveCanvaLinkAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  if (!isPremiumPlan(boda.plan)) {
    return {
      error: "El enlace de Canva está disponible en el plan Premium.",
    };
  }

  const canvaLink = String(formData.get("canva_link") ?? "").trim();
  if (!canvaLink) {
    return { error: "Pegá el link de Canva." };
  }

  try {
    const parsed = new URL(canvaLink);
    if (!parsed.hostname.includes("canva.com")) {
      return { error: "El link debe ser de canva.com." };
    }
  } catch {
    return { error: "El link de Canva no es válido." };
  }

  const misc = parseMisc(boda.misc);

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        misc: {
          ...misc,
          canvaInvitationUrl: canvaLink,
        } as object,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/invitar"]);
    return { success: "Diseño de Canva guardado." };
  } catch (err) {
    console.error("[saveCanvaLinkAction]", err);
    return { error: "No se pudo guardar el link de Canva." };
  }
}

export async function deleteCanvaLinkAction(): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  if (!isPremiumPlan(boda.plan)) {
    return;
  }

  const misc = parseMisc(boda.misc);
  const {
    canvaInvitationUrl: _removed,
    canva_invitation_url: _legacy,
    ...rest
  } = misc;

  await prisma.boda.update({
    where: { id: boda.id },
    data: {
      misc: {
        ...rest,
        canvaInvitationUrl: "",
      } as object,
    },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta/invitar"]);
}

/** Marca el paso “invitar” del checklist cuando la pareja copia o comparte el link. */
export async function markInviteSharedAction(): Promise<void> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return;
  }

  const misc = parseMisc(boda.misc);
  if (misc.inviteSharedAt) {
    return;
  }

  await prisma.boda.update({
    where: { id: boda.id },
    data: {
      misc: {
        ...misc,
        inviteSharedAt: new Date().toISOString(),
      } as object,
    },
  });

  revalidateBodaPaths(boda.slug, ["/mi-cuenta", "/mi-cuenta/invitar"]);
}
