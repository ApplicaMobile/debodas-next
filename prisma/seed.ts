import { config } from "dotenv";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@debodas.local";
const DEMO_PASSWORD = "demo1234";
const ADMIN_EMAIL = "admin@debodas.local";
const ADMIN_PASSWORD = "admin1234";

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const adminPasswordHash = await hash(ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Admin DeBodas",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin DeBodas",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "María y Juan", passwordHash, role: "couple" },
    create: {
      email: DEMO_EMAIL,
      name: "María y Juan",
      passwordHash,
      role: "couple",
    },
  });

  const demoMisc = {
    our_story:
      "Nos conocimos en 2019 y desde entonces compartimos viajes, risas y muchos mates. Queremos celebrar este nuevo capítulo con quienes formaran parte de nuestra historia.",
    spotify_url: "",
    site_source: "search",
    site_source_other: "",
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
  };

  const boda = await prisma.boda.upsert({
    where: { slug: "demo" },
    update: {
      misc: demoMisc,
      plan: "premium",
      isOnline: true,
    },
    create: {
      userId: user.id,
      slug: "demo",
      title: "María & Juan",
      plan: "premium",
      micrositeTheme: "marfil",
      isOnline: true,
      featuredImageUrl:
        "https://test.debodas.com.ar/wp-content/uploads/2026/06/1-3.jpg",
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
      misc: demoMisc,
      gifts: {
        create: [
          {
            title: "Set de ollas",
            price: 85000,
            quantity: 1,
            imageUrl: "/assets/img/gift-placeholder.jpg",
            sortOrder: 0,
          },
          {
            title: "Aporte viaje de bodas",
            price: 50000,
            quantity: 1,
            imageUrl: "/assets/img/gift-placeholder.jpg",
            sortOrder: 1,
          },
          {
            title: "Cena romántica",
            price: 120000,
            quantity: 1,
            imageUrl: "/assets/img/gift-placeholder.jpg",
            sortOrder: 2,
          },
          {
            title: "Licuadora",
            price: 65000,
            quantity: 1,
            imageUrl: "/assets/img/gift-placeholder.jpg",
            sortOrder: 3,
          },
        ],
      },
      pictures: {
        create: [
          {
            url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/2-3.jpg",
            sortOrder: 0,
          },
          {
            url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/3-1.jpg",
            sortOrder: 1,
          },
          {
            url: "https://test.debodas.com.ar/wp-content/uploads/2026/06/4-2.jpg",
            sortOrder: 2,
          },
        ],
      },
      scheduleItems: {
        create: [
          {
            time: "18:00",
            title: "Ceremonia",
            description: "Capilla principal",
            icon: "anillos",
            sortOrder: 0,
          },
          {
            time: "19:30",
            title: "Recepción",
            description: "Salón central",
            icon: "plato",
            sortOrder: 1,
          },
          {
            time: "21:00",
            title: "Cena y brindis",
            description: "Terraza",
            icon: "copas",
            sortOrder: 2,
          },
          {
            time: "00:00",
            title: "Fiesta",
            description: "Pista de baile",
            icon: "musica",
            sortOrder: 3,
          },
        ],
      },
      faqItems: {
        create: [
          {
            question: "¿Puedo llevar niños?",
            answer:
              "Preferimos una celebración solo adultos. Gracias por entender.",
            sortOrder: 0,
          },
          {
            question: "¿Hay estacionamiento?",
            answer: "Sí, hay estacionamiento gratuito dentro de la estancia.",
            sortOrder: 1,
          },
          {
            question: "¿Cómo confirmo asistencia?",
            answer: "Completá el formulario RSVP en esta misma página.",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  const scheduleSeed = [
    {
      time: "18:00",
      title: "Ceremonia",
      description: "Capilla principal",
      icon: "anillos",
      sortOrder: 0,
    },
    {
      time: "19:30",
      title: "Recepción",
      description: "Salón central",
      icon: "plato",
      sortOrder: 1,
    },
    {
      time: "21:00",
      title: "Cena y brindis",
      description: "Terraza",
      icon: "copas",
      sortOrder: 2,
    },
    {
      time: "00:00",
      title: "Fiesta",
      description: "Pista de baile",
      icon: "musica",
      sortOrder: 3,
    },
  ] as const;

  await prisma.scheduleItem.deleteMany({ where: { bodaId: boda.id } });
  await prisma.scheduleItem.createMany({
    data: scheduleSeed.map((item) => ({
      bodaId: boda.id,
      ...item,
    })),
  });

  const giftsSeed = [
    {
      title: "Set de ollas",
      price: 85000,
      quantity: 1,
      imageUrl: "/assets/img/gift-placeholder.jpg",
      sortOrder: 0,
    },
    {
      title: "Aporte viaje de bodas",
      price: 50000,
      quantity: 1,
      imageUrl: "/assets/img/gift-placeholder.jpg",
      sortOrder: 1,
    },
    {
      title: "Cena romántica",
      price: 120000,
      quantity: 1,
      imageUrl: "/assets/img/gift-placeholder.jpg",
      sortOrder: 2,
    },
    {
      title: "Licuadora",
      price: 65000,
      quantity: 1,
      imageUrl: "/assets/img/gift-placeholder.jpg",
      sortOrder: 3,
    },
  ];

  await prisma.gift.deleteMany({ where: { bodaId: boda.id } });
  await prisma.gift.createMany({
    data: giftsSeed.map((item) => ({
      bodaId: boda.id,
      ...item,
    })),
  });

  await prisma.rating.deleteMany({
    where: { email: { in: ["camila@example.com", "lucas@example.com"] } },
  });
  await prisma.rating.createMany({
    data: [
      {
        bodaId: boda.id,
        name: "Camila R.",
        email: "camila@example.com",
        score: 5,
        comment:
          "Armamos el micrositio en una tarde. Los invitados pudieron confirmar y regalar sin problemas.",
        status: "approved",
      },
      {
        bodaId: boda.id,
        name: "Lucas & Sofía",
        email: "lucas@example.com",
        score: 5,
        comment:
          "Los diseños son hermosos y la lista de regalos nos simplificó muchísimo la organización.",
        status: "approved",
      },
    ],
  });

  console.log("Seed OK:");
  console.log(`  Usuario pareja: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Usuario admin:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("  Boda: /bodas/demo");
  console.log("  Admin: /admin");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
