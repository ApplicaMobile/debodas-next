"use server";

import { requireOwnedBoda } from "@/lib/account/auth-boda";
import {
  parseCouple,
  parseEvent,
  parseMisc,
} from "@/lib/account/require-boda";
import { revalidateBodaPaths } from "@/lib/account/revalidate";
import { prisma } from "@/lib/db/prisma";
import { normalizePlan } from "@/lib/plans/features";
import { parseEventDate } from "@/lib/ratings/date";
import { parseSpotifyPlaylistId } from "@/lib/spotify/parse";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_TITLE_LENGTH = 120;
const MAX_STORY_LENGTH = 3000;
const MAX_PLACE_LENGTH = 200;
const MAX_TIME_LENGTH = 40;
const MAX_SITE_PASSWORD_LENGTH = 72;

function parseOptions(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function validateName(value: string, label: string): string | null {
  if (value.length < MIN_NAME_LENGTH) {
    return `${label} debe tener al menos ${MIN_NAME_LENGTH} caracteres.`;
  }
  if (value.length > MAX_NAME_LENGTH) {
    return `${label} no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }
  return null;
}

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
  const spotifyRaw = String(formData.get("spotify_url") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!title) {
    return { error: "Ingresá el título del micrositio." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      error: `El título no puede superar ${MAX_TITLE_LENGTH} caracteres.`,
    };
  }

  const nameError =
    validateName(brideName, "El nombre 1") ??
    validateName(groomName, "El nombre 2");
  if (nameError) {
    return { error: nameError };
  }

  if (!eventDate) {
    return { error: "Ingresá la fecha de la boda." };
  }
  if (!parseEventDate(eventDate)) {
    return {
      error: "La fecha no es válida. Usá DD/MM/AAAA o AAAA-MM-DD.",
    };
  }
  if (eventTime.length > MAX_TIME_LENGTH) {
    return { error: "La hora es demasiado larga." };
  }
  if (eventPlace.length > MAX_PLACE_LENGTH) {
    return {
      error: `El lugar no puede superar ${MAX_PLACE_LENGTH} caracteres.`,
    };
  }
  if (ourStory.length > MAX_STORY_LENGTH) {
    return {
      error: `La historia no puede superar ${MAX_STORY_LENGTH} caracteres.`,
    };
  }
  if (password.length > MAX_SITE_PASSWORD_LENGTH) {
    return {
      error: `La contraseña del micrositio no puede superar ${MAX_SITE_PASSWORD_LENGTH} caracteres.`,
    };
  }

  const isPremium = normalizePlan(boda.plan) === "premium";
  let spotifyUrl = "";
  if (isPremium && spotifyRaw) {
    const playlistId = parseSpotifyPlaylistId(spotifyRaw);
    if (!playlistId) {
      return {
        error:
          "La playlist de Spotify no es válida. Pegá el link o el ID de la playlist.",
      };
    }
    spotifyUrl = playlistId;
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
    ...(isPremium ? { spotify_url: spotifyUrl } : {}),
  };

  const options = {
    ...parseOptions(boda.options),
    password,
  };

  try {
    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        title,
        couple,
        event,
        misc,
        options,
      },
    });

    revalidateBodaPaths(boda.slug, ["/mi-cuenta/boda"]);

    return { success: "Datos guardados correctamente." };
  } catch (error) {
    console.error("[updateBodaAction]", error);
    return { error: "No se pudieron guardar los cambios." };
  }
}
