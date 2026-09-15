import {
  decryptStoredMercadoPagoSettings,
  getMercadoPagoFormValues,
  MERCADOPAGO_SETTING_KEY,
  parseMercadoPagoStoredSettings,
  resolveMercadoPagoConfig,
  type MercadoPagoFormValues,
  type MercadoPagoResolvedConfig,
  type MercadoPagoStoredSettings,
} from "@/lib/mercadopago/settings";
import { getSystemSetting } from "@/lib/system/settings";

let cached: { config: MercadoPagoResolvedConfig; at: number } | null = null;
const CACHE_TTL_MS = 15_000;

export function invalidateMercadoPagoConfigCache() {
  cached = null;
}

export async function readStoredMercadoPagoSettings(): Promise<MercadoPagoStoredSettings> {
  const raw = await getSystemSetting<unknown>(MERCADOPAGO_SETTING_KEY);
  return parseMercadoPagoStoredSettings(raw);
}

function envSnapshot() {
  return {
    envAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null,
    envPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || null,
    envWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || null,
    envSandbox: process.env.MERCADOPAGO_SANDBOX?.trim() || null,
    envWebhookStrict: process.env.MERCADOPAGO_WEBHOOK_STRICT?.trim() || null,
  };
}

export async function getMercadoPagoResolvedConfig(): Promise<MercadoPagoResolvedConfig> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.config;
  }

  const stored = decryptStoredMercadoPagoSettings(
    await readStoredMercadoPagoSettings(),
  );
  const config = resolveMercadoPagoConfig({
    stored,
    ...envSnapshot(),
  });
  cached = { config, at: Date.now() };
  return config;
}

export async function getMercadoPagoAccessToken(): Promise<string | null> {
  const config = await getMercadoPagoResolvedConfig();
  return config.accessToken;
}

export async function isMercadoPagoConfigured(): Promise<boolean> {
  return Boolean(await getMercadoPagoAccessToken());
}

export async function isMercadoPagoSandbox(): Promise<boolean> {
  const config = await getMercadoPagoResolvedConfig();
  return config.sandbox;
}

export async function getMercadoPagoWebhookSecret(): Promise<string | null> {
  const config = await getMercadoPagoResolvedConfig();
  return config.webhookSecret;
}

export async function isMercadoPagoWebhookStrict(): Promise<boolean> {
  const config = await getMercadoPagoResolvedConfig();
  return config.webhookStrict;
}

export async function getMercadoPagoSettingsForForm(): Promise<{
  form: MercadoPagoFormValues;
  resolved: MercadoPagoResolvedConfig;
}> {
  const stored = await readStoredMercadoPagoSettings();
  return {
    form: getMercadoPagoFormValues(stored, envSnapshot().envWebhookStrict),
    resolved: await getMercadoPagoResolvedConfig(),
  };
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
