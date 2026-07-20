import { workSteps } from "@/data/home";

export function StepsSection() {
  return (
    <section className="bg-[#EBEBEB] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
          Cómo iniciar
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {workSteps.map((step) => (
            <article
              key={step.number}
              className="rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.05)]"
            >
              <p className="text-sm font-semibold tracking-widest text-[#e6dac7]">
                {step.number}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-stone-800">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
