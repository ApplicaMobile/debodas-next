"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/account/form-state";
import { getAbonarConfig, getTarjetaPagos } from "@/lib/bodas/abonar-tarjeta";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { getUploadErrorMessage, saveUploadedVoucher } from "@/lib/upload/local";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/security/rate-limit";

export async function submitAbonarTarjetaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const slug = String(formData.get("boda_slug") ?? "").trim();
  const nombre = String(formData.get("nombre_invitado") ?? "").trim();
  const montoRaw = String(formData.get("monto") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const voucher = formData.get("payment_proof");

  if (website) {
    return { success: "Gracias, tu pago fue registrado correctamente." };
  }
  if (!slug) {
    return { error: "No encontramos esta boda." };
  }
  if (nombre.length < 2 || nombre.length > 120) {
    return { error: "Ingresá tu nombre." };
  }
  const monto = Number(montoRaw.replace(",", "."));
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: "Ingresá un monto válido." };
  }

  try {
    const headerStore = await headers();
    const ip = clientIpFromHeaders(headerStore);
    const limited = await checkRateLimit(
      `abonar:${slug}:${ip}`,
      6,
      15 * 60 * 1000,
    );
    if (!limited.ok) {
      return { error: `Demasiados envíos. Probá en ${limited.retryAfterSec}s.` };
    }

    const boda = await prisma.boda.findUnique({
      where: { slug },
      select: { id: true, slug: true, misc: true },
    });
    if (!boda) {
      return { error: "No encontramos esta boda." };
    }
    const config = getAbonarConfig(boda.misc);
    if (!config.titulo && !config.valorReferencia) {
      return { error: "Esta boda no tiene habilitado Abonar tarjeta." };
    }

    let comprobanteUrl = "";
    if (voucher instanceof File && voucher.size > 0) {
      comprobanteUrl = await saveUploadedVoucher(
        voucher,
        `bodas/${boda.slug}/abonar`,
      );
    }

    const misc =
      boda.misc && typeof boda.misc === "object" && !Array.isArray(boda.misc)
        ? { ...(boda.misc as Record<string, unknown>) }
        : {};
    const pagos = getTarjetaPagos(misc);
    pagos.push({
      id: randomUUID(),
      nombre,
      monto,
      comprobante_url: comprobanteUrl,
      fecha: new Date().toISOString(),
    });

    await prisma.boda.update({
      where: { id: boda.id },
      data: {
        misc: JSON.parse(
          JSON.stringify({ ...misc, tarjeta_pagos: pagos }),
        ) as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/bodas/${boda.slug}`);
    revalidatePath("/mi-cuenta/invitados");
    revalidatePath("/mi-cuenta");
    return { success: "Gracias, tu pago fue registrado correctamente." };
  } catch (error) {
    console.error("[submitAbonarTarjetaAction]", error);
    return { error: getUploadErrorMessage(error) };
  }
}
