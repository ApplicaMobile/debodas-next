/**
 * Crea o promociona un usuario admin (idempotente, sin prompts).
 *
 *   npm run db:create-admin -- --help
 *   npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
 *   docker compose exec app npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
 */
import { config } from "dotenv";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/db/prisma";

config({ path: ".env.local" });
config();

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

function printHelp() {
  console.log(`Crear o promocionar un usuario admin.

Options:
  --email=...       Email del admin (obligatorio)
  --password=...    Clave (obligatorio al crear; al actualizar, la cambia)
  --name=...        Nombre visible (opcional)
  --dry-run         Muestra qué haría, sin escribir
  --help            Esta ayuda

Examples:
  npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
  npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura' --name='Eugenio'
  docker compose exec app npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
`);
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--dry-run") {
      flags.dryRun = true;
    } else if (arg.startsWith("--email=")) {
      flags.email = arg.slice("--email=".length).trim();
    } else if (arg.startsWith("--password=")) {
      flags.password = arg.slice("--password=".length);
    } else if (arg.startsWith("--name=")) {
      flags.name = arg.slice("--name=".length).trim();
    } else {
      console.error(`Error: flag desconocida: ${arg}
  npm run db:create-admin -- --help`);
      process.exit(1);
    }
  }
  return flags;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const email = String(args.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(args.password ?? "");
  const name = String(args.name ?? "").trim() || "Admin";
  const dryRun = Boolean(args.dryRun);

  if (!email) {
    console.error(`Error: falta --email.
  npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'`);
    process.exit(1);
  }
  if (!isEmail(email)) {
    console.error(`Error: --email no es un email válido.
  npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error(
      "Error: falta DATABASE_URL. Levantá Docker o copiá .env.example → .env.local.",
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, name: true },
  });

  if (!existing && !password) {
    console.error(`Error: para crear un admin nuevo hace falta --password (mínimo ${MIN_PASSWORD} caracteres).
  npm run db:create-admin -- --email=${email} --password='clave-segura'`);
    process.exit(1);
  }

  if (password && (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD)) {
    console.error(
      `Error: --password debe tener entre ${MIN_PASSWORD} y ${MAX_PASSWORD} caracteres.`,
    );
    process.exit(1);
  }

  if (dryRun) {
    if (existing) {
      console.log(
        `dry-run: actualizaría ${email} (id=${existing.id}, role=${existing.role} → admin)${password ? " y resetearía la clave" : ""}`,
      );
    } else {
      console.log(`dry-run: crearía admin ${email} (${name})`);
    }
    return;
  }

  const passwordHash = password ? await hash(password, 10) : undefined;

  if (!existing) {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: passwordHash!,
        role: "admin",
      },
      select: { id: true, email: true, role: true },
    });
    console.log(`admin creado
id: ${created.id}
email: ${created.email}
role: ${created.role}
login: http://localhost:3000/login → /admin`);
    return;
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: "admin",
      name: args.name ? name : existing.name,
      ...(passwordHash
        ? { passwordHash, sessionVersion: { increment: 1 } }
        : {}),
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`admin actualizado
id: ${updated.id}
email: ${updated.email}
role: ${updated.role}${existing.role !== "admin" ? " (promovido)" : ""}${password ? "\nclave: actualizada (sesiones anteriores invalidas)" : ""}
login: http://localhost:3000/login → /admin`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
