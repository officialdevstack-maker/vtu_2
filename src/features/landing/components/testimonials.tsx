import { Star } from "lucide-react";
import { SectionHeading } from "./ui";
import { Reveal } from "./motion";

const testimonials = [
  {
    quote: "I fund my wallet once and forget about airtime for weeks. Never had a failed transaction yet.",
    name: "Adaeze O.",
    role: "Lagos",
    offset: false,
  },
  {
    quote: "The virtual account made bulk data purchases for my shop effortless — customers pay me, I restock in one tap.",
    name: "Chidi N.",
    role: "Enugu",
    offset: true,
  },
  {
    quote: "Electricity tokens land in seconds, even at midnight. That's genuinely rare with prepaid meters.",
    name: "Fatima B.",
    role: "Abuja",
    offset: false,
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <SectionHeading
            kicker="Testimonials"
            title="What people actually say"
            align="center"
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 0.08}
              className={t.offset ? "sm:-mt-6" : undefined}
            >
              <div className="glass shadow-premium-sm flex h-full flex-col rounded-[28px] p-7">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star key={star} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">“{t.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className="brand-primary-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  >
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
