export interface HomeStep {
  number: string;
  title: string;
  description: string;
}

export interface HomePlan {
  slug: string;
  name: string;
  price: string;
  priceNote?: string;
  isFree?: boolean;
  image: string;
  features: string[];
  cta: string;
}

export interface HomeTheme {
  slug: string;
  label: string;
  bannerImage: string;
  previewImage: string;
  demoSlug: string;
}

export interface HomeReview {
  name: string;
  rating: number;
  comment: string;
}

const MARKETING = "/assets/img/marketing";

export const heroContent = {
  backgroundImage: `${MARKETING}/hero.jpg`,
  title: "Tu boda merece una página tan especial como ese día",
  subtitle: "Diseños únicos, lista de regalos y todo listo en minutos.",
  ctaLabel: "Creá tu sitio hoy",
  ctaHref: "/registro",
};

export const workSteps: HomeStep[] = [
  {
    number: "01",
    title: "Creá tu cuenta",
    description: "Creá tu cuenta en segundos, sin tarjeta de crédito",
  },
  {
    number: "02",
    title: "Diseñá tu espacio",
    description:
      "Personalizá tu web para que tus invitados tengan toda la info del gran día en un solo lugar.",
  },
  {
    number: "03",
    title: "Elegí tu lista",
    description:
      "Hay cuatro opciones, elegí la que más te guste: Hogar, Viaje de Bodas, La Joda y Varieté",
  },
  {
    number: "04",
    title: "¡A compartir!",
    description:
      "Enviá el link a tus invitados y empezá a recibir tus regalos",
  },
];

export const plans: HomePlan[] = [
  {
    slug: "gratuito",
    name: "Gratuito",
    price: "$0",
    isFree: true,
    image: `${MARKETING}/plan-free.jpg`,
    features: [
      "Micrositio básico",
      "Hasta 10 regalos",
      "RSVP hasta 40 invitados",
      "1 regalo personalizado",
    ],
    cta: "Empezar gratis",
  },
  {
    slug: "basico",
    name: "Básico",
    price: "Desde $50.000",
    priceNote: "Pago único · Sin mensualidad",
    image: `${MARKETING}/plan-basico.jpg`,
    features: [
      "Temas premium básicos",
      "Regalos ilimitados",
      "Álbum de fotos",
      "Medios de pago avanzados",
    ],
    cta: "¡Armá tu lista!",
  },
  {
    slug: "premium",
    name: "Premium",
    price: "Desde $90.000",
    priceNote: "Pago único · Sin mensualidad",
    image: `${MARKETING}/plan-premium.jpg`,
    features: [
      "Todos los temas",
      "Invitaciones digitales",
      "RSVP con menú y mesas",
      "Soporte prioritario",
    ],
    cta: "¡Armá tu lista!",
  },
];

const themeBannerUrls: Record<string, string> = {
  base: `${MARKETING}/theme-base.jpg`,
  hojas: `${MARKETING}/theme-hojas.jpg`,
  flores: `${MARKETING}/theme-flores.jpg`,
  manantial: `${MARKETING}/theme-manantial.jpg`,
  marfil: `${MARKETING}/theme-marfil.jpg`,
  "mariposas-azules": `${MARKETING}/theme-mariposas.jpg`,
  "marco-verde": `${MARKETING}/theme-marco-verde.jpg`,
  "marco-blanco": `${MARKETING}/theme-marco-blanco.jpg`,
  "marco-flores-inferiores": `${MARKETING}/theme-marco-flores.jpg`,
};

export const themes: HomeTheme[] = [
  { slug: "base", label: "Base", demoSlug: "demo" },
  { slug: "hojas", label: "Hojas", demoSlug: "demo" },
  { slug: "flores", label: "Flores", demoSlug: "demo" },
  { slug: "manantial", label: "Manantial", demoSlug: "demo" },
  { slug: "marfil", label: "Marfil", demoSlug: "demo" },
  { slug: "mariposas-azules", label: "Mariposas azules", demoSlug: "demo" },
  { slug: "marco-verde", label: "Marco verde", demoSlug: "demo" },
  { slug: "marco-blanco", label: "Marco blanco", demoSlug: "demo" },
  {
    slug: "marco-flores-inferiores",
    label: "Marco flores inferiores",
    demoSlug: "demo",
  },
].map((theme) => ({
  ...theme,
  bannerImage: themeBannerUrls[theme.slug],
  previewImage: `/assets/img/themes/${theme.slug}-home.svg`,
}));

export const reviews: HomeReview[] = [
  {
    name: "Camila R.",
    rating: 5,
    comment:
      "Armamos el micrositio en una tarde. Los invitados pudieron confirmar y regalar sin problemas.",
  },
  {
    name: "Lucas & Sofía",
    rating: 5,
    comment:
      "Los diseños son hermosos y la lista de regalos nos simplificó muchísimo la organización.",
  },
  {
    name: "Valentina M.",
    rating: 5,
    comment:
      "Excelente experiencia. El RSVP y las mesas del plan premium nos salvaron la logística.",
  },
];

export const footerLinks = [
  { label: "Inicio", href: "/" },
  { label: "Planes", href: "/#planes" },
  { label: "Temas", href: "/#themes" },
  { label: "Micrositio demo", href: "/bodas/demo" },
  { label: "Registro", href: "/registro" },
];
