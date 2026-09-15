"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALE_MAX_AGE, parseLocale, type Locale } from "./config";

export async function setLocaleAction(locale: Locale) {
  const resolved = parseLocale(locale);
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, resolved, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
