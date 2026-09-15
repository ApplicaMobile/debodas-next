export interface WpBodaRow {
  ID: number;
  post_title: string;
  post_name: string;
  post_author: number;
  post_date: Date;
  post_modified: Date;
}

export interface WpUserRow {
  ID: number;
  user_email: string;
  display_name: string;
  user_pass: string;
  user_registered: Date;
}

export type WpMigrationStatus = "pendiente" | "migrada";

export interface WpBodaListItem {
  wpPostId: number;
  slug: string;
  title: string;
  email: string;
  coupleLabel: string;
  plan: string;
  eventDate: string;
  isOnline: boolean;
  pictureCount: number;
  giftCount: number;
  guestCount: number;
  albumHint: number;
  needsPasswordReset: boolean;
  status: WpMigrationStatus;
  prismaBodaId: string | null;
  prismaSlug: string | null;
}

export interface WpImportWarning {
  code: string;
  message: string;
}

export interface WpBodaPreview {
  wpPostId: number;
  slug: string;
  email: string;
  plan: string;
  theme: string;
  isOnline: boolean;
  gifts: number;
  pictures: number;
  guests: number;
  confirmedGifts: number;
  invitations: number;
  faq: number;
  schedule: number;
  hasPayments: boolean;
  hasDressCode: boolean;
  hasAbonar: boolean;
  abonarPagos: number;
  albumHint: number;
  needsPasswordReset: boolean;
  warnings: WpImportWarning[];
}

export interface WpMigrateResult {
  ok: boolean;
  wpPostId: number;
  slug: string;
  email?: string;
  bodaId?: string | null;
  needsPasswordReset?: boolean;
  error?: string;
  warnings?: WpImportWarning[];
}

export interface WpMigrateOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  /** Hash bcrypt ya resuelto (login: el usuario tipeó la clave). */
  passwordHash?: string;
}
