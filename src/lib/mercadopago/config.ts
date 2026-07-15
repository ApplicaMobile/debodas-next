export function getMercadoPagoAccessToken(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getMercadoPagoAccessToken());
}

export function isMercadoPagoSandbox(): boolean {
  if (process.env.MERCADOPAGO_SANDBOX === "true") {
    return true;
  }
  if (process.env.MERCADOPAGO_SANDBOX === "false") {
    return false;
  }

  const token = getMercadoPagoAccessToken() ?? "";
  return token.startsWith("TEST-");
}

export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getMercadoPagoWebhookUrl(bodaId?: string): string {
  const base = `${getAppBaseUrl()}/api/webhooks/mercadopago`;
  if (!bodaId) {
    return base;
  }
  return `${base}?bodaId=${encodeURIComponent(bodaId)}`;
}
