import { Reveal } from "./motion";

const partners = [
  "MTN", "Airtel", "Glo", "9mobile", "DStv", "GOtv", "Startimes",
  "EKEDC", "IKEDC", "AEDC", "PHEDC",
];

export function TrustedBy() {
  const track = [...partners, ...partners];

  return (
    <section aria-label="Trusted networks and billers" className="relative py-14">
      <Reveal className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Every network. Every major biller. One wallet.
        </p>
      </Reveal>

      <div className="marquee-track relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#fafafb] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#fafafb] to-transparent" />
        <div className="animate-marquee flex w-max items-center gap-3">
          {track.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="glass shadow-premium-sm select-none whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium text-slate-600"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
