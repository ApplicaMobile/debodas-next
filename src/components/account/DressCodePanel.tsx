"use client";

import Link from "next/link";
import {
  useActionState,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { updateDressCodeAction } from "@/lib/account/actions/dress-code";
import type { FormState } from "@/lib/account/form-state";
import {
  hasDressCodeContent,
  type DressCodeColor,
  type DressCodeContent,
} from "@/lib/bodas/dress-code";
import {
  isAutoColorName,
  suggestColorName,
} from "@/lib/bodas/color-names";
import { FormAlert } from "@/components/account/FormAlert";
import { StickyFormActions } from "@/components/account/StickyFormActions";
import { DressCodeSection } from "@/components/microsite/DressCodeSection";

interface DressCodePanelProps {
  dressCode: DressCodeContent;
  showDressCode: boolean;
  micrositeSlug: string;
}

const initialState: FormState = {};
const MAX_COLORS = 8;

type PaletteKey = "damas" | "caballeros";

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#C4A484";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash : "#C4A484";
}

function PaletteEditor({
  title,
  description,
  prefix,
  colors,
  onAdd,
  onRemove,
  onUpdate,
}: {
  title: string;
  description: string;
  prefix: PaletteKey;
  colors: DressCodeColor[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    field: keyof DressCodeColor,
    value: string,
  ) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={colors.length >= MAX_COLORS}
          className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Agregar color
        </button>
      </div>

      {colors.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-center">
          <p className="text-sm font-medium text-stone-700">
            Todavía no hay colores
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Agregá una paleta si querés sugerir tonos a tus invitados.
          </p>
          <button
            type="button"
            onClick={onAdd}
            disabled={colors.length >= MAX_COLORS}
            className="mt-3 rounded-full bg-[#e6dac7] px-4 py-2 text-sm font-semibold text-stone-800 disabled:opacity-50"
          >
            Agregar primer color
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {colors.map((color, index) => (
            <li
              key={`${prefix}-${index}`}
              className="grid grid-cols-[auto_minmax(5.5rem,7rem)_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-stone-100 bg-stone-50/60 px-2.5 py-2 sm:gap-3 sm:px-3"
            >
              <input
                type="color"
                aria-label={`Color ${index + 1}`}
                value={normalizeHex(color.hex)}
                onChange={(e) => onUpdate(index, "hex", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
              />
              <input
                name={`${prefix}_color_hex_${index}`}
                value={color.hex}
                onChange={(e) => onUpdate(index, "hex", e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 font-mono text-xs text-stone-800 focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/25"
                placeholder="#C4A484"
                aria-label={`Hex ${index + 1}`}
              />
              <input
                name={`${prefix}_color_name_${index}`}
                value={color.name}
                onChange={(e) => onUpdate(index, "name", e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-stone-800 focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/25"
                placeholder="Champagne"
                aria-label={`Nombre ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="shrink-0 px-1.5 text-sm font-medium text-red-600 hover:underline"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DressCodePanel({
  dressCode,
  showDressCode: initialShow,
  micrositeSlug,
}: DressCodePanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateDressCodeAction,
    initialState,
  );
  const [showDressCode, setShowDressCode] = useState(initialShow);
  const [caballeros, setCaballeros] = useState(dressCode.caballeros);
  const [damas, setDamas] = useState(dressCode.damas);
  const [colorsDamas, setColorsDamas] = useState<DressCodeColor[]>(
    dressCode.colors_damas,
  );
  const [colorsCaballeros, setColorsCaballeros] = useState<DressCodeColor[]>(
    dressCode.colors_caballeros,
  );

  function makePaletteHelpers(
    setColors: Dispatch<SetStateAction<DressCodeColor[]>>,
  ) {
    return {
      onAdd: () => {
        const hex = "#C4A484";
        setColors((prev) =>
          prev.length >= MAX_COLORS
            ? prev
            : [...prev, { hex, name: suggestColorName(hex) }],
        );
      },
      onRemove: (index: number) => {
        setColors((prev) => prev.filter((_, i) => i !== index));
      },
      onUpdate: (
        index: number,
        field: keyof DressCodeColor,
        value: string,
      ) => {
        setColors((prev) =>
          prev.map((color, i) => {
            if (i !== index) return color;
            if (field === "name") {
              return { ...color, name: value };
            }
            const nextHex = value;
            const shouldRename = isAutoColorName(color.name, color.hex);
            return {
              hex: nextHex,
              name: shouldRename ? suggestColorName(nextHex) : color.name,
            };
          }),
        );
      },
    };
  }

  const damasHelpers = makePaletteHelpers(setColorsDamas);
  const caballerosHelpers = makePaletteHelpers(setColorsCaballeros);

  const preview: DressCodeContent = useMemo(
    () => ({
      caballeros: caballeros.trim(),
      damas: damas.trim(),
      colors_caballeros: colorsCaballeros
        .map((c) => ({
          hex: c.hex.trim().startsWith("#") ? c.hex.trim() : `#${c.hex.trim()}`,
          name: c.name.trim() || c.hex.trim(),
        }))
        .filter((c) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(c.hex)),
      colors_damas: colorsDamas
        .map((c) => ({
          hex: c.hex.trim().startsWith("#") ? c.hex.trim() : `#${c.hex.trim()}`,
          name: c.name.trim() || c.hex.trim(),
        }))
        .filter((c) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(c.hex)),
    }),
    [caballeros, damas, colorsCaballeros, colorsDamas],
  );

  const hasContent = hasDressCodeContent(preview);
  const publicHref = `/bodas/${micrositeSlug}#dress-code`;

  return (
    <form action={formAction} className="space-y-6 pb-24">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
          <input
            type="checkbox"
            name="show_dress_code"
            checked={showDressCode}
            onChange={(e) => setShowDressCode(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300"
          />
          <span>
            <span className="font-medium text-stone-800">
              Mostrar sección Dress Code en el micrositio
            </span>
            <span className="mt-0.5 block text-stone-500">
              Si está apagado, los invitados no ven esta sección aunque tengas
              contenido.
            </span>
          </span>
        </label>

        {showDressCode && !hasContent ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            La sección está activada, pero todavía no hay texto ni colores. No
            se publica hasta que completes algo.
          </p>
        ) : null}

        {showDressCode && hasContent ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Se va a mostrar en el micrositio.{" "}
            <Link
              href={publicHref}
              target="_blank"
              className="font-semibold underline underline-offset-2"
            >
              Ver en el sitio ↗
            </Link>
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Caballeros
            <textarea
              name="caballeros"
              rows={3}
              value={caballeros}
              onChange={(e) => setCaballeros(e.target.value)}
              placeholder="Ej: Traje formal oscuro"
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/25"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Damas
            <textarea
              name="damas"
              rows={3}
              value={damas}
              onChange={(e) => setDamas(e.target.value)}
              placeholder="Ej: Vestido de cóctel"
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-[#e6dac7] focus:outline-none focus:ring-2 focus:ring-[#e6dac7]/25"
            />
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:items-start">
        <div className="space-y-6">
          <PaletteEditor
            title="Paleta caballeros"
            description={`Opcional. Colores sugeridos para caballeros (hasta ${MAX_COLORS}).`}
            prefix="caballeros"
            colors={colorsCaballeros}
            {...caballerosHelpers}
          />

          <PaletteEditor
            title="Paleta damas"
            description={`Opcional. Colores sugeridos para damas (hasta ${MAX_COLORS}).`}
            prefix="damas"
            colors={colorsDamas}
            {...damasHelpers}
          />
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <p className="text-sm font-semibold text-stone-800">
                Vista previa
              </p>
              <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                En vivo
              </span>
            </div>
            <div className="bg-[#F5F1EA] px-2 py-4 sm:px-3">
              {!showDressCode ? (
                <p className="px-3 py-8 text-center text-sm text-stone-500">
                  La sección está oculta en el micrositio.
                </p>
              ) : !hasContent ? (
                <p className="px-3 py-8 text-center text-sm text-stone-500">
                  Completá un texto o un color para ver la preview.
                </p>
              ) : (
                <DressCodeSection
                  dressCode={preview}
                  titleClass="text-center font-serif text-2xl font-semibold text-stone-800"
                  compact
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      <StickyFormActions alert={<FormAlert error={state.error} success={state.success} />}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar dress code"}
        </button>
      </StickyFormActions>
    </form>
  );
}
