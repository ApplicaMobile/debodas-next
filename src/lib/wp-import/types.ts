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

/** "eliminada": ya migrada pero la cuenta se dio de baja; no se vuelve a importar. */
export type WpMigrationStatus = "pendiente" | "migrada" | "eliminada";

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

/** Modo de importación: ver `persistWpBoda`. */
export type WpImportMode = "only-new" | "changed" | "overwrite";

export type WpImportAction =
  | "created"
  | "updated"
  | "overwritten"
  | "skipped"
  | "would_create"
  | "would_update"
  | "would_overwrite"
  | "error";

export interface WpMigrateResult {
  ok: boolean;
  wpPostId: number;
  slug: string;
  email?: string;
  bodaId?: string | null;
  action?: WpImportAction;
  /** Motivo del salteo: already_imported | unchanged | edited_in_next | no_baseline. */
  reason?: string;
  /** Tipo de hash WP del dueño (wp-bcrypt, bcrypt, phpass, md5, unknown). */
  hashKind?: string;
  sourceHash?: string;
  counts?: { gifts: number; pictures: number; guests: number; confirmedGifts: number };
  needsPasswordReset?: boolean;
  error?: string;
  warnings?: WpImportWarning[];
}

export interface WpMigrateOptions {
  /** Por defecto `only-new`. `overwrite` es destructivo y solo para staging. */
  mode?: WpImportMode;
  dryRun?: boolean;
  runId?: string;
  /** Hash bcrypt ya resuelto (login: el usuario tipeó la clave). */
  passwordHash?: string;
}
