import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { MarketingPageShell } from "@/components/layout/MarketingPageShell";
import { socialLinks } from "@/data/social";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escribinos un mensaje. Te respondemos a hola@debodas.com.ar sobre micrositios, planes y soporte.",
};

export default function ContactoPage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
            Contacto
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            Enviános un mensaje
          </h1>
          <p className="mt-4 text-stone-600">
            Consultas sobre planes, tu micrositio o soporte. También podés
            escribirnos directo a{" "}
            <a
              href="mailto:hola@debodas.com.ar"
              className="font-medium text-[#6f5f47] underline"
            >
              hola@debodas.com.ar
            </a>
            .
          </p>

          <ul className="mt-8 space-y-3 text-sm text-stone-600">
            <li>
              <span className="font-medium text-stone-800">Redes: </span>
              <a
                href={socialLinks.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-stone-900"
              >
                Instagram
              </a>
              {" · "}
              <a
                href={socialLinks.facebook.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-stone-900"
              >
                Facebook
              </a>
            </li>
            <li>
              <Link
                href="/terminos"
                className="underline hover:text-stone-900"
              >
                Términos y condiciones
              </Link>
              {" · "}
              <Link
                href="/privacidad"
                className="underline hover:text-stone-900"
              >
                Privacidad
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>
      </div>
    </MarketingPageShell>
  );
}
