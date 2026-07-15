import {
  getMercadoPagoAccessToken,
  isMercadoPagoSandbox,
} from "@/lib/mercadopago/config";

export class MercadoPagoApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MercadoPagoApiError";
  }
}

interface MercadoPagoPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

interface CreatePreferenceInput {
  externalReference: string;
  items: MercadoPagoPreferenceItem[];
  payerEmail?: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl: string;
  metadata?: Record<string, string>;
  accessToken?: string | null;
}

export interface MercadoPagoPreferenceResult {
  id: string;
  initPoint: string;
}

export interface MercadoPagoPaymentResult {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payer?: { email?: string };
}

async function mercadoPagoFetch<T>(
  path: string,
  init?: RequestInit,
  accessTokenOverride?: string | null,
): Promise<T> {
  const accessToken = accessTokenOverride ?? getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new MercadoPagoApiError(
      "MercadoPago no está configurado. Agregá MERCADOPAGO_ACCESS_TOKEN.",
    );
  }

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    cause?: Array<{ description?: string }>;
  };

  if (!response.ok) {
    const detail =
      payload.message ??
      payload.error ??
      payload.cause?.[0]?.description ??
      `Error HTTP ${response.status}`;
    throw new MercadoPagoApiError(detail);
  }

  return payload as T;
}

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput,
): Promise<MercadoPagoPreferenceResult> {
  const body = {
    items: input.items.map((item) => ({
      ...item,
      currency_id: item.currency_id ?? "ARS",
    })),
    payer: input.payerEmail ? { email: input.payerEmail } : undefined,
    back_urls: input.backUrls,
    auto_return: "approved",
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    metadata: input.metadata,
  };

  const result = await mercadoPagoFetch<{
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
  }>(
    "/checkout/preferences",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    input.accessToken,
  );

  if (!result.id) {
    throw new MercadoPagoApiError("MercadoPago no devolvió un ID de preferencia.");
  }

  const initPoint = isMercadoPagoSandbox()
    ? result.sandbox_init_point ?? result.init_point
    : result.init_point ?? result.sandbox_init_point;

  if (!initPoint) {
    throw new MercadoPagoApiError("MercadoPago no devolvió URL de checkout.");
  }

  return { id: result.id, initPoint };
}

export async function getMercadoPagoPayment(
  paymentId: string,
  accessToken?: string | null,
): Promise<MercadoPagoPaymentResult> {
  return mercadoPagoFetch<MercadoPagoPaymentResult>(
    `/v1/payments/${paymentId}`,
    undefined,
    accessToken,
  );
}
