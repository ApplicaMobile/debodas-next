import { optionEnabled, parseBodaOptions } from "@/lib/bodas/options";

export interface AbonarTarjetaConfig {
  titulo: string;
  valorReferencia: string;
  textoMonto: string;
}

export interface TarjetaPago {
  id: string;
  nombre: string;
  monto: number;
  comprobante_url: string;
  fecha: string;
}

export function getAbonarConfig(misc: unknown): AbonarTarjetaConfig {
  const record =
    misc && typeof misc === "object" && !Array.isArray(misc)
      ? (misc as Record<string, unknown>)
      : {};
  const nested =
    record.abonar_tarjeta &&
    typeof record.abonar_tarjeta === "object" &&
    !Array.isArray(record.abonar_tarjeta)
      ? (record.abonar_tarjeta as Record<string, unknown>)
      : {};
  return {
    titulo: String(nested.titulo ?? record.titulo_abonar_tarjeta ?? "").trim(),
    valorReferencia: String(
      nested.valor_referencia ?? record.valor_referencia_tarjeta ?? "",
    ).trim(),
    textoMonto: String(
      nested.texto_monto ?? record.texto_monto_tarjeta ?? "",
    ).trim(),
  };
}

export function getTarjetaPagos(misc: unknown): TarjetaPago[] {
  const record =
    misc && typeof misc === "object" && !Array.isArray(misc)
      ? (misc as Record<string, unknown>)
      : {};
  const raw = record.tarjeta_pagos;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      const nombre = String(row.nombre ?? "").trim();
      const monto = Number(row.monto ?? 0);
      if (!nombre && !Number.isFinite(monto)) {
        return null;
      }
      return {
        id: String(row.id ?? `pago-${index}`),
        nombre: nombre || "Invitado",
        monto: Number.isFinite(monto) ? monto : 0,
        comprobante_url: String(row.comprobante_url ?? ""),
        fecha: String(row.fecha ?? ""),
      };
    })
    .filter((item): item is TarjetaPago => item !== null);
}

export function isAbonarEnabled(
  misc: unknown,
  options?: unknown,
): boolean {
  const config = getAbonarConfig(misc);
  if (config.titulo || config.valorReferencia) {
    return true;
  }
  return optionEnabled(parseBodaOptions(options).show_abonar);
}
