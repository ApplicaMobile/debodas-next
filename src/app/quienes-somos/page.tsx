import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "@/components/layout/MarketingPageShell";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "DeBodas: la forma inteligente de organizar y compartir tu boda. Micrositios, RSVP, regalos y más.",
};

const features = [
  {
    number: "01",
    title: "Gestión de invitados eficiente",
    description:
      "Confirmación de asistencia (RSVP), selección de menús especiales y organización de mesas en tiempo real.",
  },
  {
    number: "02",
    title: "Lista de regalos flexible",
    description:
      "Recibí el valor de tus regalos a través de todos los medios de pago de forma directa y transparente.",
  },
  {
    number: "03",
    title: "Experiencia interactiva",
    description:
      "Conectá tu ubicación con Google Maps, compartí tu playlist de Spotify, respondé preguntas frecuentes (FAQ) y creá un álbum de fotos digital para recordar cada momento.",
  },
] as const;

export default function QuienesSomosPage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-4xl px-6">
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
            DeBodas
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-5xl">
            ¿Quiénes somos?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            La forma inteligente de organizar y compartir tu boda.
          </p>
        </header>

        <section className="mt-12 space-y-5 text-base leading-relaxed text-stone-700 sm:text-lg">
          <p>
            Sabemos que planificar una boda es un momento único, pero también
            que la lista de tareas puede volverse interminable. DeBodas nació
            para transformar todo ese proceso. Somos una plataforma digital
            pensada para simplificar la organización de tu evento, uniendo
            diseño, tecnología y practicidad en un solo lugar.
          </p>
          <p>
            Nos emociona saber que, detrás de la pantalla, estamos ordenando el
            caos para que disfrutes cada paso del camino. Así, mientras la
            plataforma trabaja para vos, tu única ocupación real sea prepararte
            para celebrar.
          </p>
          <p className="font-medium text-stone-800">
            Diseñamos la estructura que hace tu vida más fácil. Vos solo
            ocupate de disfrutar.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-center font-serif text-2xl font-semibold text-stone-800 sm:text-3xl">
            ¿Qué encontrás en nuestra plataforma?
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.05)]"
              >
                <p className="text-sm font-semibold tracking-widest text-[#e6dac7]">
                  {feature.number}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-stone-800">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/registro"
            className="rounded-full bg-[#e6dac7] px-8 py-3 text-sm font-semibold text-stone-800"
          >
            Creá tu sitio hoy
          </Link>
          <Link
            href="/bodas/demo"
            className="rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-700"
          >
            Ver ejemplo
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
