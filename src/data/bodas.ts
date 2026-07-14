import type { Boda } from "@/types/boda";

export const demoBoda: Boda = {
  id: 1,
  slug: "demo",
  title: "María & Juan",
  plan: "premium",
  microsite_theme: "marfil",
  couple: {
    bride_name: "María",
    groom_name: "Juan",
  },
  event: {
    date: "15/11/2026",
    time: "19:30",
    place: "Estancia La Paz, Pilar",
  },
  banner: {
    image: {
      url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/5-2.jpg",
    },
  },
  options: {
    show_faq: 1,
    show_dress_code: 1,
  },
  misc: {
    our_story:
      "Nos conocimos en 2019 y desde entonces compartimos viajes, risas y muchos mates. Queremos celebrar este nuevo capítulo con quienes formaron parte de nuestra historia.",
    spotify_url: "",
  },
  gifts_list: {
    gifts: [
      {
        title: "Set de ollas",
        price: 85000,
        quantity: 1,
      },
      {
        title: "Aporte viaje de bodas",
        price: 50000,
        quantity: 1,
      },
      {
        title: "Cena romántica",
        price: 120000,
        quantity: 1,
      },
      {
        title: "Licuadora",
        price: 65000,
        quantity: 1,
      },
    ],
  },
  pictures: [
    {
      url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/2-3.jpg",
    },
    {
      url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/3-1.jpg",
    },
    {
      url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/4-2.jpg",
    },
  ],
  schedule: [
    { time: "18:00", title: "Ceremonia", description: "Capilla principal" },
    { time: "19:30", title: "Recepción", description: "Salón central" },
    { time: "21:00", title: "Cena y brindis", description: "Terraza" },
    { time: "00:00", title: "Fiesta", description: "Pista de baile" },
  ],
  faq_items: [
    {
      question: "¿Puedo llevar niños?",
      answer: "Preferimos una celebración solo adultos. Gracias por entender.",
    },
    {
      question: "¿Hay estacionamiento?",
      answer: "Sí, hay estacionamiento gratuito dentro de la estancia.",
    },
    {
      question: "¿Cómo confirmo asistencia?",
      answer: "Completá el formulario RSVP en esta misma página.",
    },
  ],
  featured_image: {
    url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/1-3.jpg",
  },
};

const bodasBySlug: Record<string, Boda> = {
  demo: demoBoda,
};

export function getMockBodaBySlug(slug: string): Boda | null {
  return bodasBySlug[slug] ?? null;
}

export function getCoupleDisplayName(couple: Boda["couple"]): string {
  const bride =
    (couple.bride_name as string | undefined) ??
    (couple.bride as string | undefined) ??
    "";
  const groom =
    (couple.groom_name as string | undefined) ??
    (couple.groom as string | undefined) ??
    "";

  const names = [bride, groom].filter(Boolean);
  return names.length > 0 ? names.join(" & ") : "Pareja";
}

export function getBannerUrl(boda: Boda): string | null {
  const banner = boda.banner?.image as { url?: string } | undefined;
  if (banner?.url) {
    return banner.url;
  }
  return boda.featured_image?.url ?? null;
}

export function formatPrice(value: number | string): string {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(amount)) {
    return String(value);
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
