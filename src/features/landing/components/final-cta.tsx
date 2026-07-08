import { ArrowRight } from "lucide-react";
import { Button, GlowOrb } from "./ui";
import { Reveal } from "./motion";

export function FinalCta() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-[#0b0b12] px-8 py-16 text-center sm:px-16 sm:py-20">
            <GlowOrb className="landing-brand-glow left-1/2 top-0 h-[420px] w-[560px] -translate-x-1/2 -translate-y-1/3 opacity-80" />
            <div className="noise-layer" />
            <div className="relative">
              <h2 className="text-balance mx-auto max-w-xl text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
                Your wallet is one tap away from every bill you owe.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">
                Create your free account and make your first payment in minutes — no card required to sign up.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button to="/register" size="lg">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Button>
                <Button to="/login" variant="ghost-dark" size="lg">
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
