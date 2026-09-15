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

export async function StepsSection() {
  const { messages } = await getDictionary();

  return (
    <section className="relative overflow-hidden bg-[#EBEBEB] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
            {t(messages, "home.stepsEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {t(messages, "home.stepsTitle")}
          </h2>
          <p className="mt-4 text-stone-600">{t(messages, "home.stepsLead")}</p>
        </div>

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[12%] right-[12%] top-5 hidden h-px bg-stone-300/80 xl:block"
          />
          {WORK_KEYS.map((step) => (
            <li key={step.number} className="relative text-center xl:text-left">
              <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#06263a] font-serif text-sm font-semibold text-[#e6dac7] xl:mx-0">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-stone-800">
                {t(messages, step.title)}
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                {t(messages, step.desc)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-20 max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
            {t(messages, "home.guestEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {t(messages, "home.guestTitle")}
          </h2>
          <p className="mt-4 text-stone-600">{t(messages, "home.guestLead")}</p>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {GUEST_KEYS.map((step) => (
            <li key={`guest-${step.number}`} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white font-serif text-sm font-semibold text-[#06263a]">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-stone-800">
                {t(messages, step.title)}
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                {t(messages, step.desc)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
