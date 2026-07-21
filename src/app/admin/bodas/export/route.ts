import { requireAdmin } from "@/lib/admin/require-admin";
import {
  coupleLabel,
  csvEscape,
  eventDateFromJson,
  phoneFromCouple,
} from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  getAdminAuditContext,
  writeAdminAudit,
} from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin();

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const planFilter = (searchParams.get("plan") ?? "").trim().toLowerCase();

  const where: Prisma.BodaWhereInput = {};
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { slug: { contains: query } },
      { user: { email: { contains: query } } },
      { user: { name: { contains: query } } },
    ];
  }
  if (planFilter && ["free", "basico", "premium"].includes(planFilter)) {
    where.plan = planFilter;
  }

  const bodas = await prisma.boda.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { rsvpGuests: true, gifts: true, ratings: true } },
    },
  });

  const audit = await getAdminAuditContext(admin);
  await prisma.$transaction((tx) =>
    writeAdminAudit(tx, audit, {
      action: "admin.bodas.exported",
      entity: "boda_collection",
      metadata: {
        query,
        plan: planFilter,
        rowCount: bodas.length,
      },
    }),
  );

  const header = [
    "id",
    "title",
    "slug",
    "plan",
    "theme",
    "event_date",
    "phone",
    "owner_name",
    "owner_email",
    "rsvp",
    "gifts",
    "ratings",
    "rating_email_sent_at",
    "created_at",
  ];

  const rows = bodas.map((boda) =>
    [
      boda.id,
      coupleLabel(boda.couple, boda.title),
      boda.slug,
      boda.plan,
      boda.micrositeTheme,
      eventDateFromJson(boda.event),
      phoneFromCouple(boda.couple),
      boda.user.name ?? "",
      boda.user.email,
      String(boda._count.rsvpGuests),
      String(boda._count.gifts),
      String(boda._count.ratings),
      boda.ratingEmailSentAt?.toISOString() ?? "",
      boda.createdAt.toISOString(),
    ]
      .map((cell) => csvEscape(cell))
      .join(","),
  );

  const csv = `\uFEFF${[header.join(","), ...rows].join("\n")}`;
  const filename = `bodas-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
