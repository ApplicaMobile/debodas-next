export function HoneypotField({ id }: { id: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden"
    >
      <label htmlFor={id}>Sitio web</label>
      <input
        id={id}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
