import { legacyHexMap } from "@/tokens/legacy-hex-map";
import { Section, Spec } from "./Section";

export function LegacyHex() {
  return (
    <Section
      id="migracion"
      overline="Integración"
      title="Migración de hex hardcodeados"
      lead={<>Los {legacyHexMap.length} hex encontrados en TSX de debodas-next y el token que los reemplaza (detalle en el README).</>}
    >
      <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-default">
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <caption className="sr-only">Mapeo de hex viejos a tokens</caption>
          <thead>
            <tr className="border-b border-border-subtle bg-surface-muted">
              {["Hex viejo", "Usos", "Primitivo", "Token recomendado", "Nota"].map((h) => (
                <th key={h} scope="col" className="p-3 type-label text-text-primary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {legacyHexMap.map((r) => (
              <tr key={r.hex} className="border-b border-border-subtle last:border-0 align-top">
                <th scope="row" className="p-3">
                  <span className="flex items-center gap-2">
                    {/* Muestra del color viejo: dato documental, no estilo de UI. */}
                    <span className="size-4 shrink-0 rounded-sm border border-border-default" style={{ backgroundColor: r.hex }} aria-hidden="true" />
                    <span className="font-mono text-sm text-text-primary">{r.hex}</span>
                  </span>
                </th>
                <td className="p-3 type-body-sm tabular-nums text-text-secondary">{r.usos}</td>
                <td className="p-3 type-body-sm text-text-secondary">{r.primitivo}</td>
                <td className="p-3 type-body-sm text-text-primary"><Spec>{r.token}</Spec></td>
                <td className="p-3 type-body-sm text-text-secondary">{r.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
