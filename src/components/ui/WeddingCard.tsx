import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconArrowRight, IconCalendar, IconMapPin } from "./icons";

export interface WeddingCardProps {
  /** Nombres de la pareja, p. ej. "Sofía & Martín". */
  names: string;
  /** Fecha ISO (YYYY-MM-DD) del evento. */
  date: string;
  location: string;
  image: { src: string; alt: string };
  /** URL del micrositio (/bodas/[slug]). */
  href: string;
  /** Nivel del título (por defecto h3). */
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
  /** Carga prioritaria (solo para la primera card visible). */
  priority?: boolean;
}

export function formatWeddingDate(iso: string): string {
  // Mediodía UTC: evita que el huso horario corra la fecha un día.
  const d = new Date(`${iso}T12:00:00Z`);
  const text = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(d);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Card para "Próximas bodas". Toda la card es clickeable mediante un único link
 * (el nombre) estirado con ::after: un solo tab-stop y un nombre accesible claro.
 */
export function WeddingCard({ names, date, location, image, href, headingLevel: Heading = "h3", className, priority }: WeddingCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md bg-surface-default shadow-elevation-1 transition-shadow hover:shadow-elevation-2 motion-reduce:transition-none",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus-ring",
        className,
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          unoptimized={image.src.endsWith(".svg")}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Heading className="type-h4 text-text-primary">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {names}
          </Link>
        </Heading>
        <dl className="flex flex-col gap-2 type-body-sm text-text-secondary">
          <div className="flex items-start gap-2">
            <dt className="sr-only">Fecha</dt>
            <IconCalendar size={16} className="mt-[3px] shrink-0 text-text-accent" />
            <dd>
              <time dateTime={date}>{formatWeddingDate(date)}</time>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">Lugar</dt>
            <IconMapPin size={16} className="mt-[3px] shrink-0 text-text-accent" />
            <dd>{location}</dd>
          </div>
        </dl>
        <span aria-hidden="true" className="mt-auto inline-flex items-center gap-2 pt-2 type-button-sm text-text-link group-hover:underline">
          Ver sitio <IconArrowRight size={16} />
        </span>
      </div>
    </article>
  );
}
