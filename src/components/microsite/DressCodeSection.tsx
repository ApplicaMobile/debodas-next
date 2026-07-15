import type { DressCodeContent } from "@/lib/bodas/dress-code";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";

interface DressCodeSectionProps {
  dressCode: DressCodeContent;
  titleClass: string;
}

export function DressCodeSection({
  dressCode,
  titleClass,
}: DressCodeSectionProps) {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <div className="microsite-dress-code">
        <MicrositeSectionTitle className={titleClass}>
          Dress Code
        </MicrositeSectionTitle>

        {(dressCode.caballeros || dressCode.damas) && (
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
        )}

        {dressCode.colors.length ? (
          <div className="microsite-dress-code__palette">
            <p className="microsite-dress-code__palette-label">
              Paleta de colores sugeridos: Damas
            </p>
            <div className="microsite-dress-code__colors">
              {dressCode.colors.map((color) => (
                <div
                  key={`${color.hex}-${color.name}`}
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
        ) : null}
      </div>
    </div>
  );
}
