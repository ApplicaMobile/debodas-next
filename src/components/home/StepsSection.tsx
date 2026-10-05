import { MarketingSectionHeader } from "@/components/home/MarketingSectionHeader";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

const WORK_KEYS = [
  { number: "01", title: "home.work1Title", desc: "home.work1Desc" },
  { number: "02", title: "home.work2Title", desc: "home.work2Desc" },
  { number: "03", title: "home.work3Title", desc: "home.work3Desc" },
  { number: "04", title: "home.work4Title", desc: "home.work4Desc" },
] as const;

const GUEST_KEYS = [
  { number: "01", title: "home.guest1Title", desc: "home.guest1Desc" },
  { number: "02", title: "home.guest2Title", desc: "home.guest2Desc" },
  { number: "03", title: "home.guest3Title", desc: "home.guest3Desc" },
] as const;

/** Paso en mobile: número a la izquierda + texto, unidos por una línea vertical. */
const MOBILE_STEP =
  "relative grid grid-cols-[2.5rem_1fr] content-start gap-x-4 text-left before:absolute before:left-5 before:top-12 before:-bottom-6 before:w-px before:bg-stone-300 last:before:hidden sm:block sm:text-center sm:before:hidden";

export async function StepsSection() {
  const { messages } = await getDictionary();

  return (
    <section className="relative overflow-hidden bg-[#EBEBEB] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <MarketingSectionHeader
          eyebrow={t(messages, "home.stepsEyebrow")}
          title={t(messages, "home.stepsTitle")}
          lead={t(messages, "home.stepsLead")}
        />

        {/* Mobile: línea de tiempo alineada a la izquierda. Desde sm, la grilla de siempre. */}
        <ol className="relative mt-10 grid gap-8 sm:mt-14 sm:grid-cols-2 sm:gap-10 xl:grid-cols-4 xl:gap-6">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[12%] right-[12%] top-5 hidden h-px bg-stone-300/80 xl:block"
          />
          {WORK_KEYS.map((step) => (
            <li key={step.number} className={`${MOBILE_STEP} xl:text-left`}>
              <span className="relative z-10 row-span-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#06263a] font-serif text-sm font-semibold text-[#e6dac7] sm:mx-auto xl:mx-0">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-stone-800 sm:mt-5">
                {t(messages, step.title)}
              </h3>
              <p className="mt-1 text-sm leading-7 text-stone-600 sm:mt-2">
                {t(messages, step.desc)}
              </p>
            </li>
          ))}
        </ol>

        <MarketingSectionHeader
          className="mt-16 sm:mt-20"
          eyebrow={t(messages, "home.guestEyebrow")}
          title={t(messages, "home.guestTitle")}
          lead={t(messages, "home.guestLead")}
        />

        <ol className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-10">
          {GUEST_KEYS.map((step) => (
            <li key={`guest-${step.number}`} className={MOBILE_STEP}>
              <span className="relative z-10 row-span-2 flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white font-serif text-sm font-semibold text-[#06263a] sm:mx-auto">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-stone-800 sm:mt-5">
                {t(messages, step.title)}
              </h3>
              <p className="mt-1 text-sm leading-7 text-stone-600 sm:mt-2">
                {t(messages, step.desc)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
