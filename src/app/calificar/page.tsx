import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RatingForm } from "@/components/ratings/RatingForm";
import { getCoupleDisplayName } from "@/data/bodas";
import { prisma } from "@/lib/db/prisma";
import { hasEventDatePassed } from "@/lib/ratings/date";
import type { Boda as BodaShape } from "@/types/boda";

interface PageProps {
  searchParams: Promise<{ bodaId?: string }>;
}

export default async function CalificarPage({ searchParams }: PageProps) {
  const { bodaId } = await searchParams;

  if (!bodaId) {
    return (
      <Shell>
        <EmptyState
          title="Enlace incompleto"
          message="Necesitás un enlace de calificación válido. Si llegaste por email, abrí el link completo."
        />
      </Shell>
    );
  }

  let boda: {
    id: string;
    title: string;
    couple: unknown;
    event: unknown;
  } | null = null;

  try {
    boda = await prisma.boda.findUnique({
      where: { id: bodaId },
      select: { id: true, title: true, couple: true, event: true },
    });
  } catch (error) {
    console.error("[CalificarPage]", error);
  }

  if (!boda) {
    return (
      <Shell>
        <EmptyState
          title="Boda no encontrada"
          message="No encontramos la boda asociada a este enlace."
        />
      </Shell>
    );
  }

  const coupleName =
    getCoupleDisplayName((boda.couple ?? {}) as BodaShape["couple"]) ||
    boda.title;

  if (!hasEventDatePassed(boda.event)) {
    return (
      <Shell>
        <EmptyState
          title="Todavía no disponible"
          message={`Podrás calificar el servicio de DeBodas para ${coupleName} después de la fecha de la boda.`}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="font-serif text-3xl font-semibold text-stone-800">
          Calificá nuestro servicio
        </h1>
        <div className="mt-6">
          <RatingForm bodaId={boda.id} coupleName={coupleName} />
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70vh] bg-[#F5F1E8] py-12">
        <div className="mx-auto max-w-xl px-6">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
      <h1 className="font-serif text-2xl font-semibold text-stone-800">{title}</h1>
      <p className="mt-3 text-stone-600">{message}</p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-semibold text-[#e6dac7] hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
