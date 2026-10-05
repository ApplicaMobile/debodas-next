import Link from "next/link";
import { MarketingSectionHeader } from "@/components/home/MarketingSectionHeader";
import { buttonClasses } from "@/components/ui";
import { socialLinks } from "@/data/social";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

/**
 * CTA a Instagram (perfil público).
 * No usa Graph API: en WP solo había URL de red social en ACF options.
 */
export async function InstagramSection() {
  const { messages } = await getDictionary();
  const { href, handle } = socialLinks.instagram;

  return (
    <section className="relative overflow-hidden bg-[#F5F1E8] py-20 sm:py-24" id="instagram">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,218,199,0.9),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(108,195,158,0.18),transparent_40%)]" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <MarketingSectionHeader
          eyebrow={t(messages, "home.instagramEyebrow")}
          title={t(messages, "home.instagramTitle")}
          lead={t(messages, "home.instagramLead")}
        />
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "primario", className: "mt-8" })}
        >
          <span aria-hidden className="text-base">
            ✦
          </span>
          {t(messages, "home.instagramCta", { handle })}
        </Link>
      </div>
    </section>
  );
}
