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
    dress_code: {
      caballeros: "Traje formal oscuro o smoking",
      damas: "Vestido de cóctel o largo elegante",
      colors_caballeros: [
        { hex: "#1C1C1C", name: "Negro" },
        { hex: "#2F4F4F", name: "Verde oscuro" },
        { hex: "#4A5568", name: "Gris" },
      ],
      colors_damas: [
        { hex: "#C4A484", name: "Champagne" },
        { hex: "#8B7355", name: "Taupe" },
        { hex: "#5C4033", name: "Marrón" },
        { hex: "#2F4F4F", name: "Verde oscuro" },
      ],
    },
    payment_settings: {
      bank_account: {
        bank: "Banco Demo",
        cbu: "0170001540000000000000",
        owner: "María y Juan",
        alias: "demo.debodas",
      },
      mp_alias_cvu: {
        owner_mp: "María y Juan",
        alias_cvu_mp: "demo.mp.debodas",
      },
    },
  },
  gifts_list: {
    gifts: [
      {
        id: "mock-gift-1",
        title: "Set de ollas",
        price: 85000,
        quantity: 1,
        image: { url: "/assets/img/gift-placeholder.jpg" },
      },
      {
        id: "mock-gift-2",
        title: "Aporte viaje de bodas",
        price: 50000,
        quantity: 1,
        image: { url: "/assets/img/gift-placeholder.jpg" },
      },
      {
        id: "mock-gift-3",
        title: "Cena romántica",
        price: 120000,
        quantity: 1,
        image: { url: "/assets/img/gift-placeholder.jpg" },
      },
      {
        id: "mock-gift-4",
        title: "Licuadora",
        price: 65000,
        quantity: 1,
        image: { url: "/assets/img/gift-placeholder.jpg" },
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
    {
      time: "18:00",
      title: "Ceremonia",
      description: "Capilla principal",
      icon: "anillos",
    },
    {
      time: "19:30",
      title: "Recepción",
      description: "Salón central",
      icon: "plato",
    },
    {
      time: "21:00",
      title: "Cena y brindis",
      description: "Terraza",
      icon: "copas",
    },
    {
      time: "00:00",
      title: "Fiesta",
      description: "Pista de baile",
      icon: "musica",
    },
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
