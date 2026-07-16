import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { SectionHeading } from "./ui";
import { Reveal } from "./motion";
import { buildFaqs } from "./faq-data";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { app_name } = useBranding();
  const faqs = buildFaqs(app_name);

  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <SectionHeading kicker="FAQ" title="Questions, answered" align="center" />
        </Reveal>

        <Reveal delay={0.1} className="mt-12 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.question} className="glass shadow-premium-sm overflow-hidden rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-medium text-slate-900">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900/[0.05] text-slate-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
