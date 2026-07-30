import type {
  DressCodeColor,
  DressCodeContent,
} from "@/lib/bodas/dress-code";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";

interface DressCodeSectionProps {
  dressCode: DressCodeContent;
  titleClass: string;
  /** Preview en panel: menos padding / sin max-width externo */
  compact?: boolean;
}

function ColorPalette({
  label,
  colors,
}: {
  label: string;
  colors: DressCodeColor[];
}) {
  if (!colors.length) {
    return null;
  }

  return (
    <div className="microsite-dress-code__palette">
      <p className="microsite-dress-code__palette-label">{label}</p>
      <div className="microsite-dress-code__colors">
        {colors.map((color, index) => (
          <div
            key={`${label}-${index}`}
            className="microsite-dress-code__color"
          >
            <span
              className="microsite-dress-code__swatch"
              style={{ backgroundColor: color.hex }}
              title={color.name || color.hex}
              role="img"
              aria-label={color.name || color.hex}
            />
            <span className="microsite-dress-code__color-name">
              {color.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DressCodeSection({
  dressCode,
  titleClass,
  compact = false,
}: DressCodeSectionProps) {
  const showCaballeros = Boolean(dressCode.caballeros);
  const showDamas = Boolean(dressCode.damas);
  const columnCount = Number(showCaballeros) + Number(showDamas);
  const showColumns = columnCount > 0;
  const showPalettes = Boolean(
    dressCode.colors_caballeros.length || dressCode.colors_damas.length,
  );

  return (
    <div className={compact ? "mx-auto w-full" : "mx-auto max-w-2xl px-6"}>
      <div
        className={`microsite-dress-code ${compact ? "microsite-dress-code--compact" : ""}`}
      >
        {compact ? (
          <h2 className={titleClass}>Dress Code</h2>
        ) : (
          <MicrositeSectionTitle className={titleClass}>
            Dress Code
          </MicrositeSectionTitle>
        )}

        {showColumns ? (
          <div
            className={`microsite-dress-code__columns mt-8 ${
              columnCount === 1 ? "microsite-dress-code__columns--single" : ""
            }`}
          >
            {showCaballeros ? (
              <div className="microsite-dress-code__col">
                <h3 className="microsite-dress-code__col-title">Caballeros</h3>
                <p className="microsite-dress-code__col-text">
                  {dressCode.caballeros}
                </p>
              </div>
            ) : null}
            {showDamas ? (
              <div className="microsite-dress-code__col">
                <h3 className="microsite-dress-code__col-title">Damas</h3>
                <p className="microsite-dress-code__col-text">
                  {dressCode.damas}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showPalettes ? (
          <div
            className={`microsite-dress-code__palettes ${showColumns ? "mt-6" : "mt-8"}`}
          >
            <ColorPalette
              label="Caballeros"
              colors={dressCode.colors_caballeros}
            />
            <ColorPalette
              label="Damas"
              colors={dressCode.colors_damas}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
