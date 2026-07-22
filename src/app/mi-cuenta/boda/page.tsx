import Link from "next/link";
import { notFound } from "next/navigation";
import { BodaForm } from "@/components/account/BodaForm";
import {
  getOwnedBoda,
  parseCouple,
  parseEvent,
  parseMisc,
} from "@/lib/account/require-boda";

export default async function MiCuentaBodaPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const couple = parseCouple(boda.couple);
  const event = parseEvent(boda.event);
  const misc = parseMisc(boda.misc);
  const options = (boda.options ?? {}) as Record<string, unknown>;
  const password =
    typeof options.password === "string" ? options.password : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
            Datos de la boda
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Editá la información principal que ven tus invitados en el
            micrositio.
          </p>
        </div>
        <Link
          href={`/bodas/${boda.slug}`}
          target="_blank"
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Ver micrositio ↗
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-4 sm:rounded-3xl sm:p-8 shadow-sm">
        <BodaForm
          initialValues={{
            title: boda.title,
            brideName: String(couple.bride_name ?? couple.bride ?? ""),
            groomName: String(couple.groom_name ?? couple.groom ?? ""),
            eventDate: String(event.date ?? ""),
            eventTime: String(event.time ?? ""),
            eventPlace: String(event.place ?? ""),
            ourStory: String(misc.our_story ?? ""),
            spotifyUrl: String(misc.spotify_url ?? misc.spotify ?? ""),
            slug: boda.slug,
            password,
            plan: boda.plan,
          }}
        />
      </section>
    </div>
  );
}
