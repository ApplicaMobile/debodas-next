import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
import { DressCodePanel } from "@/components/account/DressCodePanel";
import { getOwnedBoda } from "@/lib/account/require-boda";
import { getDressCode } from "@/lib/bodas/dress-code";

function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

function parseMisc(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

function parseOptions(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

export default async function MiCuentaDressCodePage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const options = parseOptions(boda.options);
  const dressCode = getDressCode(parseMisc(boda.misc));

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/dress-code"
        section="Dress code"
        title="Dress code"
        description="Indicá cómo vestirse y, si querés, una paleta de colores sugeridos para tus invitados."
      />
      <DressCodePanel
        dressCode={dressCode}
        showDressCode={optionEnabled(options.show_dress_code)}
        micrositeSlug={boda.slug}
      />
    </AccountPageBody>
  );
}
