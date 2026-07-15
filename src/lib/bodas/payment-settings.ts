import { normalizePlan } from "@/lib/plans/features";

export interface MpTokens {
  public_key?: string;
  access_token?: string;
}

export interface MpAliasCvu {
  owner_mp?: string;
  alias_cvu_mp?: string;
}

export interface BankAccount {
  bank?: string;
  cbu?: string;
  owner?: string;
  alias?: string;
}

export interface PaypalSettings {
  paypal_me?: string;
  owner?: string;
}

export interface BodaPaymentSettings {
  mp_tokens?: MpTokens;
  mp_alias_cvu?: MpAliasCvu;
  bank_account?: BankAccount;
  bank_account_usd?: BankAccount;
  paypal?: PaypalSettings;
}

export function getPaymentSettings(
  misc: Record<string, unknown> | null | undefined,
): BodaPaymentSettings {
  const raw = misc?.payment_settings;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as BodaPaymentSettings;
}

export function hasMpCheckout(settings: BodaPaymentSettings): boolean {
  const publicKey = settings.mp_tokens?.public_key?.trim();
  const accessToken = settings.mp_tokens?.access_token?.trim();
  return Boolean(publicKey && accessToken);
}

export function hasMpTransfer(settings: BodaPaymentSettings): boolean {
  const owner = settings.mp_alias_cvu?.owner_mp?.trim();
  const alias = settings.mp_alias_cvu?.alias_cvu_mp?.trim();
  return Boolean(owner && alias);
}

export function hasBankTransferArs(settings: BodaPaymentSettings): boolean {
  const bank = settings.bank_account?.bank?.trim();
  const cbu = settings.bank_account?.cbu?.trim();
  return Boolean(bank && cbu);
}

export function hasBankTransferUsd(
  settings: BodaPaymentSettings,
  plan: string,
): boolean {
  const normalized = normalizePlan(plan);
  if (normalized === "free") {
    return false;
  }

  const bank = settings.bank_account_usd?.bank?.trim();
  const cbu = settings.bank_account_usd?.cbu?.trim();
  return Boolean(bank && cbu);
}

export function hasPaypal(settings: BodaPaymentSettings): boolean {
  const paypalMe = settings.paypal?.paypal_me?.trim();
  return Boolean(paypalMe);
}

export function getAvailableGiftPaymentMethods(
  settings: BodaPaymentSettings,
  plan: string,
): string[] {
  const methods: string[] = [];

  if (hasBankTransferArs(settings)) {
    methods.push("bank_transfer_ars");
  }
  if (hasBankTransferUsd(settings, plan)) {
    methods.push("bank_transfer_usd");
  }
  if (hasMpTransfer(settings)) {
    methods.push("mp_transfer");
  }
  if (hasMpCheckout(settings)) {
    methods.push("mp_checkout");
  }
  if (hasPaypal(settings)) {
    methods.push("paypal");
  }

  return methods;
}

export interface PublicPaymentOptions {
  methods: string[];
  mp_alias_cvu?: MpAliasCvu;
  bank_account?: BankAccount;
  bank_account_usd?: BankAccount;
  paypal?: PaypalSettings;
}

export function getPublicPaymentOptions(
  settings: BodaPaymentSettings,
  plan: string,
): PublicPaymentOptions {
  return {
    methods: getAvailableGiftPaymentMethods(settings, plan),
    mp_alias_cvu: settings.mp_alias_cvu,
    bank_account: settings.bank_account,
    bank_account_usd: hasBankTransferUsd(settings, plan)
      ? settings.bank_account_usd
      : undefined,
    paypal: settings.paypal,
  };
}
