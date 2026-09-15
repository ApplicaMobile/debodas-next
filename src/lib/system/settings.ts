import { prisma } from "@/lib/db/prisma";

export async function getSystemSetting<T>(
  key: string,
): Promise<T | null> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return null;
    }
    return row.value as T;
  } catch (error) {
    console.warn(`[system-settings] no se pudo leer "${key}"`, error);
    return null;
  }
}

export async function setSystemSetting(
  key: string,
  value: object,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
