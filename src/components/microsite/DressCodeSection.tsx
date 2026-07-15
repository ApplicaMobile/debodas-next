import type {
  DressCodeColor,
  DressCodeContent,
} from "@/lib/bodas/dress-code";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";

interface DressCodeSectionProps {
  dressCode: DressCodeContent;
  titleClass: string;
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
              aria-hidden="true"
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
}: DressCodeSectionProps) {
  const showColumns = Boolean(dressCode.caballeros || dressCode.damas);
  const showPalettes = Boolean(
    dressCode.colors_caballeros.length || dressCode.colors_damas.length,
  );

  return (
    <div className="mx-auto max-w-2xl px-6">
      <div className="microsite-dress-code">
        <MicrositeSectionTitle className={titleClass}>
          Dress Code
        </MicrositeSectionTitle>

        {showColumns ? (
          <div className="microsite-dress-code__columns mt-8">
            {dressCode.caballeros ? (
              <div className="microsite-dress-code__col">
                <h3 className="microsite-dress-code__col-title">Caballeros</h3>
                <p className="microsite-dress-code__col-text">
                  {dressCode.caballeros}
                </p>
              </div>
            ) : null}
            {dressCode.damas ? (
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
              label="Paleta sugerida: Caballeros"
              colors={dressCode.colors_caballeros}
            />
            <ColorPalette
              label="Paleta sugerida: Damas"
              colors={dressCode.colors_damas}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
