import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, Wifi, ScanLine, CheckCircle2 } from "lucide-react";
import { SectionHeading, GlowOrb } from "./ui";
import { Reveal } from "./motion";
import { WalletMockup, BuyDataMockup, QrMockup, SuccessMockup, AccountMockup, HistoryMockup } from "./mockups";

const tabs = [
  {
    id: "wallet",
    label: "Fund your wallet",
    description: "Top up from any bank, card, or virtual account and pay from a single balance.",
    icon: Wallet,
    Mockup: WalletMockup,
  },
  {
    id: "data",
    label: "Buy data & airtime",
    description: "Pick a network and plan — every purchase settles automatically, no delays.",
    icon: Wifi,
    Mockup: BuyDataMockup,
  },
  {
    id: "qr",
    label: "Pay with QR",
    description: "Scan to pay in person or share a code to receive money instantly.",
    icon: ScanLine,
    Mockup: QrMockup,
  },
  {
    id: "confirm",
    label: "Instant confirmation",
    description: "Get a clear receipt the moment a payment lands — every single time.",
    icon: CheckCircle2,
    Mockup: SuccessMockup,
  },
] as const;

export function ProductShowcase() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("wallet");
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];
  const ActiveMockup = activeTab.Mockup;

  return (
    <section id="showcase" className="relative py-24 sm:py-28">
      <Reveal>
        <SectionHeading
          kicker="Product tour"
          title="One wallet. Every payment, handled."
          description="See how Vendify turns a handful of taps into a confirmed, settled payment — no waiting on 'processing'."
          align="center"
        />
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-[0.85fr_1fr] lg:gap-6">
        <Reveal delay={0.1} className="space-y-2">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                aria-pressed={isActive}
                className={`block w-full rounded-2xl px-5 py-4 text-left transition-all duration-300 ${
                  isActive ? "glass-strong shadow-premium-sm" : "hover:bg-slate-900/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive ? "brand-primary-bg text-white" : "bg-slate-900/[0.05] text-slate-500"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                    {tab.label}
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-2 pl-12 text-sm leading-relaxed text-slate-500"
                    >
                      {tab.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </Reveal>

        <Reveal delay={0.2} className="relative flex h-[420px] items-center justify-center sm:h-[460px]">
          <GlowOrb className="landing-brand-glow left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 opacity-70" />

          <div className="absolute left-2 top-4 rotate-[-9deg] opacity-60 blur-[1.5px] sm:left-6">
            <div className="scale-[0.78] sm:scale-[0.82]">
              <AccountMockup />
            </div>
          </div>
          <div className="absolute bottom-2 right-0 rotate-[8deg] opacity-60 blur-[1.5px] sm:right-4">
            <div className="scale-[0.78] sm:scale-[0.82]">
              <HistoryMockup />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10"
            >
              <ActiveMockup />
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
