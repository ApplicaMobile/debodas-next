import { revalidatePath } from "next/cache";

export function revalidateBodaPaths(slug: string, accountPaths: string[] = []) {
  revalidatePath(`/bodas/${slug}`);
  revalidatePath("/mi-cuenta");

  for (const path of accountPaths) {
    revalidatePath(path);
  }
}
