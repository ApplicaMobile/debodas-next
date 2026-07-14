import { prisma } from "@/lib/db/prisma";

function slugifyPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSlugBase(brideName: string, groomName: string): string {
  const parts = [slugifyPart(brideName), slugifyPart(groomName)].filter(
    Boolean,
  );

  if (parts.length === 0) {
    return "mi-boda";
  }

  return parts.join("-");
}

export async function generateUniqueSlug(
  brideName: string,
  groomName: string,
): Promise<string> {
  const base = buildSlugBase(brideName, groomName);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.boda.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
