import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { SectionHeading } from "./ui";
import { Reveal } from "./motion";

const buildFaqs = (appName: string) => [
  {
    question: "How fast are payments delivered?",
    answer:
      "Most airtime, data and electricity purchases complete within seconds. If a provider is slow to respond, we retry automatically in the background.",
  },
  {
    question: "Are there any hidden fees?",
    answer: `No. Airtime purchases come with a discount, and every other transaction carries zero ${appName} fees. Any charge is always shown before you confirm.`,
  },
  {
    question: "Is my money safe?",
    answer:
      "Your wallet is backed by a dedicated virtual account in your name. We never store your card or bank credentials on our servers.",
  },
  {
    question: "What happens if a transaction fails?",
    answer:
      "If a purchase fails after your wallet is debited, the amount is automatically reversed — no support ticket required.",
  },
  {
    question: "Which networks and billers are supported?",
    answer:
      "All four major mobile networks, DStv, GOtv and Startimes for cable TV, and every major electricity distribution company nationwide.",
  },
  {
    question: `Can I use ${appName} for my business?`,
    answer:
      "Yes — many customers use their wallet and virtual account to resell data and airtime to their own customers at a markup.",
  },
];

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
