import { notFound } from "next/navigation";
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
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          Dress code
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Indicá cómo vestirse y, si querés, una paleta de colores sugeridos.
        </p>
      </div>
      <DressCodePanel
        dressCode={dressCode}
        showDressCode={optionEnabled(options.show_dress_code)}
      />
    </div>
  );
}
