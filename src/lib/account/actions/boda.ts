"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import {
  parseCouple,
  parseEvent,
  parseMisc,
} from "@/lib/account/require-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { prisma } from "@/lib/db/prisma";
export interface BodaFormState {
  error?: string;
  success?: string;
}

export async function updateBodaAction(
  _prevState: BodaFormState,
  formData: FormData,
): Promise<BodaFormState> {
  const { error, boda } = await requireOwnedBoda();
  if (error || !boda) {
    return { error: error ?? "No encontramos tu boda." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const brideName = String(formData.get("bride_name") ?? "").trim();
  const groomName = String(formData.get("groom_name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const eventTime = String(formData.get("event_time") ?? "").trim();
  const eventPlace = String(formData.get("event_place") ?? "").trim();
  const ourStory = String(formData.get("our_story") ?? "").trim();

  if (!title || !brideName || !groomName || !eventDate) {
    return { error: "Completá título, nombres y fecha del evento." };
  }

  const couple = {
    ...parseCouple(boda.couple),
    bride_name: brideName,
    groom_name: groomName,
  };

  const event = {
    ...parseEvent(boda.event),
    date: eventDate,
    time: eventTime,
    place: eventPlace,
  };

  const misc = {
    ...parseMisc(boda.misc),
    our_story: ourStory,
  };

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        title,
        couple,
        event,
        misc,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/boda"]);

    return { success: "Datos guardados correctamente." };
  } catch (error) {
    console.error("[updateBodaAction]", error);
    return { error: "No se pudieron guardar los cambios." };
  }
}
