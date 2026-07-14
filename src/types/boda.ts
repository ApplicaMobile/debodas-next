export interface BodaImage {
  id?: number;
  url?: string;
  alt?: string;
}

export interface BodaCouple {
  bride?: string;
  groom?: string;
  bride_name?: string;
  groom_name?: string;
  [key: string]: unknown;
}

export interface BodaEvent {
  date?: string;
  time?: string;
  place?: string;
  [key: string]: unknown;
}

export interface BodaOptions {
  show_faq?: number | boolean;
  show_dress_code?: number | boolean;
  password?: string;
  [key: string]: unknown;
}

export interface BodaGift {
  title?: string;
  price?: number | string;
  image?: number | BodaImage;
  quantity?: number;
  [key: string]: unknown;
}

export interface Boda {
  id: number | string;
  slug: string;
  title: string;
  plan: string | null;
  microsite_theme: string;
  couple: BodaCouple;
  event: BodaEvent;
  banner: Record<string, unknown>;
  options: BodaOptions;
  misc: Record<string, unknown>;
  gifts_list: {
    gifts?: BodaGift[];
    [key: string]: unknown;
  };
  pictures: unknown[];
  schedule: unknown[];
  faq_items: unknown[];
  featured_image: BodaImage | null;
}

export interface HealthResponse {
  status: string;
  plugin: string;
  version: string;
  wordpress: string;
  acf: boolean;
  theme: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  data?: {
    status?: number;
  };
}
