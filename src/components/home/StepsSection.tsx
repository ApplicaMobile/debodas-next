import { workSteps } from "@/data/home";

export function StepsSection() {
  return (
    <section className="relative overflow-hidden bg-[#EBEBEB] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
            Empezá hoy
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            Cómo iniciar
          </h2>
          <p className="mt-4 text-stone-600">
            Cuatro pasos simples desde la cuenta hasta compartir el link.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[12%] right-[12%] top-5 hidden h-px bg-stone-300/80 xl:block"
          />
          {workSteps.map((step) => (
            <li key={step.number} className="relative text-center xl:text-left">
              <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#06263a] font-serif text-sm font-semibold text-[#e6dac7] xl:mx-0">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-stone-800">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
