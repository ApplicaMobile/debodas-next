import { decryptSecret, encryptSecret, isEncryptedSecret } from "@/lib/security/secrets";

export const MERCADOPAGO_SETTING_KEY = "mercadopago";

export type MercadoPagoSandboxMode = "auto" | "on" | "off";

export interface MercadoPagoStoredSettings {
  accessToken?: string;
  publicKey?: string;
  webhookSecret?: string;
  sandbox?: boolean | null;
  webhookStrict?: boolean;
}

export type MercadoPagoConfigSource = "db" | "env" | "none";

export interface MercadoPagoResolvedConfig {
  accessToken: string | null;
  publicKey: string | null;
  webhookSecret: string | null;
  sandbox: boolean;
  webhookStrict: boolean;
  source: {
    accessToken: MercadoPagoConfigSource;
    webhookSecret: MercadoPagoConfigSource;
    sandbox: "db" | "env" | "token" | "default";
  };
}

export interface MercadoPagoFormValues {
  publicKey: string;
  accessTokenMasked: string;
  accessTokenSaved: boolean;
  webhookSecretMasked: string;
  webhookSecretSaved: boolean;
  sandboxMode: MercadoPagoSandboxMode;
  webhookStrict: boolean;
}

export interface MercadoPagoFormInput {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  sandboxMode: MercadoPagoSandboxMode;
  webhookStrict: boolean;
  clearAccessToken: boolean;
  clearWebhookSecret: boolean;
}

export function parseMercadoPagoStoredSettings(
  raw: unknown,
): MercadoPagoStoredSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const value = raw as Record<string, unknown>;
  return {
    accessToken:
      typeof value.accessToken === "string" ? value.accessToken : undefined,
    publicKey: typeof value.publicKey === "string" ? value.publicKey : undefined,
    webhookSecret:
      typeof value.webhookSecret === "string" ? value.webhookSecret : undefined,
    sandbox:
      value.sandbox === true || value.sandbox === false
        ? value.sandbox
        : value.sandbox === null
          ? null
          : undefined,
    webhookStrict:
      typeof value.webhookStrict === "boolean" ? value.webhookStrict : undefined,
  };
}

export function decryptStoredMercadoPagoSettings(
  stored: MercadoPagoStoredSettings,
): MercadoPagoStoredSettings {
  return {
    ...stored,
    accessToken: stored.accessToken
      ? decryptSecret(stored.accessToken)
      : undefined,
    webhookSecret: stored.webhookSecret
      ? decryptSecret(stored.webhookSecret)
      : undefined,
  };
}

function looksMasked(value: string): boolean {
  return value.includes("•");
}

function pickSecret(
  incoming: string,
  previous: string | undefined,
  clear: boolean,
): string | undefined {
  if (clear) {
    return undefined;
  }

  const trimmed = incoming.trim();
  if (!trimmed || looksMasked(trimmed)) {
    return previous || undefined;
  }
  if (isEncryptedSecret(trimmed)) {
    return trimmed;
  }
  return encryptSecret(trimmed);
}

export function sandboxModeFromStored(
  sandbox: boolean | null | undefined,
): MercadoPagoSandboxMode {
  if (sandbox === true) return "on";
  if (sandbox === false) return "off";
  return "auto";
}

export function sandboxFromMode(
  mode: MercadoPagoSandboxMode,
): boolean | null {
  if (mode === "on") return true;
  if (mode === "off") return false;
  return null;
}

export function applyMercadoPagoFormUpdate(
  previous: MercadoPagoStoredSettings,
  incoming: MercadoPagoFormInput,
): MercadoPagoStoredSettings {
  const accessToken = pickSecret(
    incoming.accessToken,
    previous.accessToken,
    incoming.clearAccessToken,
  );
  const webhookSecret = pickSecret(
    incoming.webhookSecret,
    previous.webhookSecret,
    incoming.clearWebhookSecret,
  );
  const publicKey = incoming.publicKey.trim();

  return {
    accessToken,
    publicKey: publicKey || undefined,
    webhookSecret,
    sandbox: sandboxFromMode(incoming.sandboxMode),
    webhookStrict: incoming.webhookStrict,
  };
}

export function resolveMercadoPagoConfig(input: {
  stored?: MercadoPagoStoredSettings | null;
  envAccessToken?: string | null;
  envPublicKey?: string | null;
  envWebhookSecret?: string | null;
  envSandbox?: string | null;
  envWebhookStrict?: string | null;
}): MercadoPagoResolvedConfig {
  const stored = input.stored ?? {};
  const storedToken = stored.accessToken?.trim() || null;
  const envToken = input.envAccessToken?.trim() || null;
  const accessToken = storedToken || envToken;
  const accessTokenSource: MercadoPagoConfigSource = storedToken
    ? "db"
    : envToken
      ? "env"
      : "none";

  const storedPublicKey = stored.publicKey?.trim() || null;
  const envPublicKey = input.envPublicKey?.trim() || null;
  const publicKey = storedPublicKey || envPublicKey;

  const storedWebhook = stored.webhookSecret?.trim() || null;
  const envWebhook = input.envWebhookSecret?.trim() || null;
  const webhookSecret = storedWebhook || envWebhook;
  const webhookSecretSource: MercadoPagoConfigSource = storedWebhook
    ? "db"
    : envWebhook
      ? "env"
      : "none";

  let sandbox = false;
  let sandboxSource: MercadoPagoResolvedConfig["source"]["sandbox"] = "default";
  if (stored.sandbox === true || stored.sandbox === false) {
    sandbox = stored.sandbox;
    sandboxSource = "db";
  } else if (input.envSandbox === "true") {
    sandbox = true;
    sandboxSource = "env";
  } else if (input.envSandbox === "false") {
    sandbox = false;
    sandboxSource = "env";
  } else if ((accessToken ?? "").startsWith("TEST-")) {
    sandbox = true;
    sandboxSource = "token";
  }

  const webhookStrict =
    typeof stored.webhookStrict === "boolean"
      ? stored.webhookStrict
      : input.envWebhookStrict === "true";

  return {
    accessToken,
    publicKey,
    webhookSecret,
    sandbox,
    webhookStrict,
    source: {
      accessToken: accessTokenSource,
      webhookSecret: webhookSecretSource,
      sandbox: sandboxSource,
    },
  };
}

export function getMercadoPagoFormValues(
  stored: MercadoPagoStoredSettings | null,
  envWebhookStrict?: string | null,
): MercadoPagoFormValues {
  const accessTokenSaved = Boolean(stored?.accessToken?.trim());
  const webhookSecretSaved = Boolean(stored?.webhookSecret?.trim());

  return {
    publicKey: stored?.publicKey?.trim() ?? "",
    accessTokenMasked: accessTokenSaved ? "••••••••••••" : "",
    accessTokenSaved,
    webhookSecretMasked: webhookSecretSaved ? "••••••••••••" : "",
    webhookSecretSaved,
    sandboxMode: sandboxModeFromStored(stored?.sandbox),
    webhookStrict:
      typeof stored?.webhookStrict === "boolean"
        ? stored.webhookStrict
        : envWebhookStrict === "true",
  };
}
