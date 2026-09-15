import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { MarketingPageShell } from "@/components/layout/MarketingPageShell";
import { socialLinks } from "@/data/social";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

const CONTACT_EMAIL = "hola@debodas.com.ar";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getDictionary();
  return {
    title: t(messages, "contact.eyebrow"),
    description: t(messages, "contact.lead", { email: CONTACT_EMAIL }),
  };
}

export default async function ContactoPage() {
  const { messages } = await getDictionary();

  return (
    <MarketingPageShell>
      <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div>
          <p className="font-serif text-xl font-semibold tracking-tight text-stone-800">
            DeBodas
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
            {t(messages, "contact.eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {t(messages, "contact.title")}
          </h1>
          <p className="mt-4 text-stone-600">
            {t(messages, "contact.lead", { email: CONTACT_EMAIL })}
          </p>
          <p className="mt-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-[#6f5f47] underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>

          <ul className="mt-8 space-y-3 text-sm text-stone-600">
            <li>
              <span className="font-medium text-stone-800">
                {t(messages, "contact.networks")}:{" "}
              </span>
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
              <Link href="/terminos" className="underline hover:text-stone-900">
                {t(messages, "footer.terms")}
              </Link>
              {" · "}
              <Link
                href="/privacidad"
                className="underline hover:text-stone-900"
              >
                {t(messages, "footer.privacy")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_16px_50px_rgba(45,45,45,0.06)] sm:p-8">
          <ContactForm />
        </div>
      </div>
    </MarketingPageShell>
  );
}
