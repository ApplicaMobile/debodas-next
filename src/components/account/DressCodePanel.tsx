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
import {
  AccountFormActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { formControlClassName } from "@/components/account/FormField";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Textarea,
} from "@/components/ui";
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
    <div className="border-t border-border-subtle pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="type-overline text-text-accent">{title}</p>
          <p className="mt-1 type-body-sm text-text-secondary">{description}</p>
        </div>
        {colors.length > 0 ? (
          <Button
            type="button"
            variant="secundario"
            size="sm"
            onClick={onAdd}
            disabled={colors.length >= MAX_COLORS}
            className="shrink-0"
          >
            Agregar color
          </Button>
        ) : null}
      </div>

      {colors.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-md border border-dashed border-border-default bg-surface-muted px-4 py-5 text-center">
          <div>
            <p className="type-label text-text-primary">Todavía no hay colores</p>
            <p className="mt-1 type-body-sm text-text-secondary">
              Agregá una paleta si querés sugerir tonos a tus invitados.
            </p>
          </div>
          <Button
            type="button"
            variant="secundario"
            size="sm"
            onClick={onAdd}
            disabled={colors.length >= MAX_COLORS}
          >
            Agregar primer color
          </Button>
        </div>
      ) : (
        <ul role="list" className="mt-4 space-y-2">
          {colors.map((color, index) => (
            <li
              key={`${prefix}-${index}`}
              className="grid grid-cols-[auto_minmax(5.5rem,7rem)_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border-subtle bg-surface-muted px-2.5 py-2 sm:gap-3 sm:px-3"
            >
              <input
                type="color"
                aria-label={`Color ${index + 1}`}
                value={normalizeHex(color.hex)}
                onChange={(e) => onUpdate(index, "hex", e.target.value)}
                className="focus-ring h-11 w-11 cursor-pointer rounded-sm border border-border-strong bg-surface-default p-0.5"
              />
              <input
                name={`${prefix}_color_hex_${index}`}
                value={color.hex}
                onChange={(e) => onUpdate(index, "hex", e.target.value)}
                className={`${formControlClassName} min-h-11 px-2.5 py-2 font-mono type-body-sm`}
                placeholder="#C4A484"
                aria-label={`Hex ${index + 1}`}
              />
              <input
                name={`${prefix}_color_name_${index}`}
                value={color.name}
                onChange={(e) => onUpdate(index, "name", e.target.value)}
                className={`${formControlClassName} min-h-11 px-2.5 py-2 type-body-sm`}
                placeholder="Champagne"
                aria-label={`Nombre ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="focus-ring inline-flex min-h-9 shrink-0 items-center rounded-full px-2.5 type-button-sm text-status-error-fg hover:bg-status-error-bg"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
    <div className="grid gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:items-start">
      <AccountSection
        id="dress-code-contenido"
        title="Cómo vestirse"
        description="Texto para cada grupo y, si querés, colores sugeridos. Mirá la vista previa antes de guardar."
      >
        <form action={formAction} className="space-y-6">
          <div className="space-y-4">
            <Checkbox
              name="show_dress_code"
              checked={showDressCode}
              onChange={(e) => setShowDressCode(e.target.checked)}
              label={
                <span className="font-semibold">
                  Mostrar sección Dress Code en el micrositio
                </span>
              }
              description="Si está apagado, los invitados no ven esta sección aunque tengas contenido."
            />

            {showDressCode && !hasContent ? (
              <Alert tone="pendiente" title="Falta contenido">
                La sección está activada, pero todavía no hay texto ni colores.
                No se publica hasta que completes algo.
              </Alert>
            ) : null}

            {showDressCode && hasContent ? (
              <Alert tone="exito" title="Se va a mostrar en el micrositio.">
                <Link
                  href={publicHref}
                  target="_blank"
                  className="focus-ring rounded-sm font-semibold text-text-link underline underline-offset-2"
                >
                  Ver en el sitio ↗
                </Link>
              </Alert>
            ) : null}
          </div>

          <div className="grid gap-5 border-t border-border-subtle pt-6 sm:grid-cols-2">
            <Textarea
              id="caballeros"
              label="Caballeros"
              name="caballeros"
              rows={3}
              value={caballeros}
              onChange={(e) => setCaballeros(e.target.value)}
              placeholder="Ej: Traje formal oscuro"
            />
            <Textarea
              id="damas"
              label="Damas"
              name="damas"
              rows={3}
              value={damas}
              onChange={(e) => setDamas(e.target.value)}
              placeholder="Ej: Vestido de cóctel"
            />
          </div>

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

          <AccountFormActions
            alert={<FormAlert error={state.error} success={state.success} />}
          >
            <Button type="submit" loading={isPending} loadingLabel="Guardando…">
              Guardar dress code
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>

      <aside className="xl:sticky xl:top-24" aria-label="Vista previa del dress code">
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <p className="type-label text-text-primary">Vista previa</p>
            <Badge tone="info" icon={false}>
              En vivo
            </Badge>
          </div>
          <div className="bg-surface-muted px-2 py-4 sm:px-3">
            {!showDressCode ? (
              <p className="px-3 py-8 text-center type-body-sm text-text-secondary">
                La sección está oculta en el micrositio.
              </p>
            ) : !hasContent ? (
              <p className="px-3 py-8 text-center type-body-sm text-text-secondary">
                Completá un texto o un color para ver la preview.
              </p>
            ) : (
              <DressCodeSection
                dressCode={preview}
                titleClass="text-center font-serif text-2xl font-semibold text-text-primary"
                compact
              />
            )}
          </div>
        </Card>
      </aside>
    </div>
  );
}
