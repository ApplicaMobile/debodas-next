import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.includes("debodas_web_e2e")) {
    throw new Error("Seed E2E abortado: DATABASE_URL no apunta a la base E2E");
  }

  const [demoPassword, adminPassword, resetPassword] = await Promise.all([
    hash("demo1234", 10),
    hash("admin1234", 10),
    hash("reset1234", 10),
  ]);

  const admin = await prisma.user.create({
    data: {
      id: "user-admin-e2e",
      email: "admin@debodas.local",
      name: "Admin DeBodas",
      passwordHash: adminPassword,
      role: "admin",
    },
  });

  const demo = await prisma.user.create({
    data: {
      id: "user-demo-e2e",
      email: "demo@debodas.local",
      name: "María y Juan",
      passwordHash: demoPassword,
      role: "couple",
    },
  });

  await prisma.boda.create({
    data: {
      id: "boda-demo-e2e",
      userId: demo.id,
      slug: "demo",
      title: "María & Juan",
      plan: "premium",
      micrositeTheme: "base",
      isOnline: true,
      couple: { bride_name: "María", groom_name: "Juan" },
      event: {
        date: "15/11/2030",
        time: "19:30",
        place: "Salón E2E",
      },
      banner: {},
      options: { show_faq: 1, show_dress_code: 1 },
      misc: {},
    },
  });

  const ratingUser = await prisma.user.create({
    data: {
      id: "user-rating-e2e",
      email: "rating@debodas.local",
      name: "Pareja Rating",
      passwordHash: demoPassword,
      role: "couple",
    },
  });

  await prisma.boda.create({
    data: {
      id: "boda-e2e-past",
      userId: ratingUser.id,
      slug: "e2e-past",
      title: "Boda E2E pasada",
      plan: "premium",
      micrositeTheme: "base",
      isOnline: true,
      couple: { bride_name: "Prueba", groom_name: "E2E" },
      event: { date: "01/01/2020", time: "20:00", place: "Salón E2E" },
      banner: {},
      options: {},
      misc: {},
    },
  });

  const resetUser = await prisma.user.create({
    data: {
      id: "user-reset-e2e",
      email: "reset@debodas.local",
      name: "Usuario Reset",
      passwordHash: resetPassword,
      role: "couple",
    },
  });
  const resetToken = "e2e-reset-token-known";
  await prisma.passwordResetToken.create({
    data: {
      userId: resetUser.id,
      tokenHash: createHash("sha256").update(resetToken).digest("hex"),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  console.log("Seed E2E listo", {
    admin: admin.email,
    demo: demo.email,
    reset: resetUser.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
