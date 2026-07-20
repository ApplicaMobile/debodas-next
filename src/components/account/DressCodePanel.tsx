"use client";

import { useActionState, useState, type Dispatch, type SetStateAction } from "react";
import { updateDressCodeAction } from "@/lib/account/actions/dress-code";
import type { FormState } from "@/lib/account/form-state";
import type {
  DressCodeColor,
  DressCodeContent,
} from "@/lib/bodas/dress-code";
import { FormAlert } from "@/components/account/FormAlert";

interface DressCodePanelProps {
  dressCode: DressCodeContent;
  showDressCode: boolean;
}

const initialState: FormState = {};

type PaletteKey = "damas" | "caballeros";

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
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={colors.length >= 8}
          className="shrink-0 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-50"
        >
          Agregar color
        </button>
      </div>

      {colors.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          Todavía no hay colores. Podés agregar una paleta si querés.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {colors.map((color, index) => (
            <li
              key={`${prefix}-${index}`}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-100 p-3"
            >
              <label className="text-sm text-stone-700">
                Color
                <input
                  type="color"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(color.hex)
                      ? color.hex
                      : "#C4A484"
                  }
                  onChange={(e) => onUpdate(index, "hex", e.target.value)}
                  className="mt-1 block h-10 w-14 cursor-pointer rounded border border-stone-200 bg-white p-1"
                />
              </label>
              <label className="min-w-[7rem] flex-1 text-sm text-stone-700">
                Hex
                <input
                  name={`${prefix}_color_hex_${index}`}
                  value={color.hex}
                  onChange={(e) => onUpdate(index, "hex", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  placeholder="#C4A484"
                />
              </label>
              <label className="min-w-[10rem] flex-[2] text-sm text-stone-700">
                Nombre
                <input
                  name={`${prefix}_color_name_${index}`}
                  value={color.name}
                  onChange={(e) => onUpdate(index, "name", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  placeholder="Champagne"
                />
              </label>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="pb-2 text-sm text-red-600 hover:underline"
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
  showDressCode,
}: DressCodePanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateDressCodeAction,
    initialState,
  );
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
        setColors((prev) =>
          prev.length >= 8 ? prev : [...prev, { hex: "#C4A484", name: "" }],
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
          prev.map((color, i) =>
            i === index ? { ...color, [field]: value } : color,
          ),
        );
      },
    };
  }

  const damasHelpers = makePaletteHelpers(setColorsDamas);
  const caballerosHelpers = makePaletteHelpers(setColorsCaballeros);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <label className="flex items-center gap-3 text-sm text-stone-700">
          <input
            type="checkbox"
            name="show_dress_code"
            defaultChecked={showDressCode}
            className="h-4 w-4 rounded border-stone-300"
          />
          Mostrar sección Dress Code en el micrositio
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-stone-700">
            Caballeros
            <textarea
              name="caballeros"
              rows={4}
              defaultValue={dressCode.caballeros}
              placeholder="Ej: Traje formal oscuro"
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3"
            />
          </label>
          <label className="block text-sm text-stone-700">
            Damas
            <textarea
              name="damas"
              rows={4}
              defaultValue={dressCode.damas}
              placeholder="Ej: Vestido de cóctel"
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3"
            />
          </label>
        </div>
      </section>

      <PaletteEditor
        title="Paleta caballeros"
        description="Opcional. Colores sugeridos para caballeros (hasta 8)."
        prefix="caballeros"
        colors={colorsCaballeros}
        {...caballerosHelpers}
      />

      <PaletteEditor
        title="Paleta damas"
        description="Opcional. Colores sugeridos para damas (hasta 8)."
        prefix="damas"
        colors={colorsDamas}
        {...damasHelpers}
      />

      <div className="space-y-3">
        <FormAlert error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar dress code"}
        </button>
      </div>
    </form>
  );
}
