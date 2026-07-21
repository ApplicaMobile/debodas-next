import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const tokens = new Map<string, number>();
const words = new Set(
  readFileSync(join(process.cwd(), "node_modules", "dictionary-es", "index.dic"), "utf8")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split("/")[0]?.trim().toLocaleLowerCase("es"))
    .filter(Boolean),
);
const LOST_CHARS = ["á", "é", "í", "ó", "ú", "ñ", "ü"];

function candidates(token: string): string[] {
  if (!/\p{L}\?\p{L}/u.test(token)) return [];
  const lower = token.toLocaleLowerCase("es");
  return LOST_CHARS.map((char) => lower.replace("?", char)).filter((word) =>
    words.has(word),
  );
}

function inspect(value: unknown) {
  if (typeof value === "string") {
    for (const token of value.match(/[\p{L}]*\?[\p{L}]*/gu) ?? []) {
      if (token.length > 1) {
        tokens.set(token, (tokens.get(token) ?? 0) + 1);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(inspect);
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach(inspect);
  }
}

async function main() {
  const [bodas, users, gifts, faqs, guests, schedule, confirmed] =
    await Promise.all([
      prisma.boda.findMany({
        select: {
          title: true,
          couple: true,
          event: true,
          banner: true,
          options: true,
          misc: true,
        },
      }),
      prisma.user.findMany({ select: { name: true } }),
      prisma.gift.findMany({ select: { title: true } }),
      prisma.faqItem.findMany({ select: { question: true, answer: true } }),
      prisma.rsvpGuest.findMany({
        select: { name: true, notes: true, tableName: true },
      }),
      prisma.scheduleItem.findMany({
        select: { title: true, description: true },
      }),
      prisma.confirmedGift.findMany({
        select: { participants: true, dedication: true, items: true },
      }),
    ]);

  [bodas, users, gifts, faqs, guests, schedule, confirmed].forEach(inspect);

  if (process.argv.includes("--contexts")) {
    const collections = { bodas, users, gifts, faqs, guests, schedule, confirmed };
    const unresolved = ["bD?hs", "DzHgH?hs", "imp?rtate", "Invitaci?n", "Ka?esky", "quedan?para"];
    for (const [collection, rows] of Object.entries(collections)) {
      for (const row of rows) {
        const serialized = JSON.stringify(row);
        if (unresolved.some((token) => serialized.includes(token))) {
          console.log(`CONTEXT ${collection}: ${serialized}`);
        }
      }
    }
  }

  let internalCount = 0;
  for (const [token, count] of [...tokens.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )) {
    if (!/\p{L}\?\p{L}/u.test(token)) continue;
    internalCount += 1;
    const options = candidates(token);
    console.log(
      `${String(count).padStart(4)}  ${token}${options.length ? `  => ${options.join(", ")}` : ""}`,
    );
  }
  console.log(`\n${internalCount} tokens internos sin resolver`);
}

main().finally(() => prisma.$disconnect());
