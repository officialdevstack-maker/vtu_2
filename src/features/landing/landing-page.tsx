import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import "./styles/landing.css";
import { Navbar } from "./components/navbar";
import { BackgroundField } from "./components/background-field";
import { Hero } from "./components/hero";
import { buildFaqs } from "./components/faq-data";
import { useBranding } from "@/shared/branding";
import { useSeo } from "@/shared/seo";

const lazyNamed = <T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  name: K,
) => lazy(() => loader().then((module) => ({ default: module[name] as ComponentType })));

const TrustedBy = lazyNamed(() => import("./components/trusted-by"), "TrustedBy");
const ProductShowcase = lazyNamed(() => import("./components/product-showcase"), "ProductShowcase");
const Services = lazyNamed(() => import("./components/services"), "Services");
const WhyVendify = lazyNamed(() => import("./components/why-vendify"), "WhyVendify");
const HowItWorks = lazyNamed(() => import("./components/how-it-works"), "HowItWorks");
const Stats = lazyNamed(() => import("./components/stats"), "Stats");
const Pricing = lazyNamed(() => import("./components/pricing"), "Pricing");
const Testimonials = lazyNamed(() => import("./components/testimonials"), "Testimonials");
const Faq = lazyNamed(() => import("./components/faq"), "Faq");
const FinalCta = lazyNamed(() => import("./components/final-cta"), "FinalCta");
const Footer = lazyNamed(() => import("./components/footer"), "Footer");

function DeferredSection({
  children,
  minHeight = "min-h-[240px]",
  id,
}: {
  children: ReactNode;
  minHeight?: string;
  id?: string;
}) {
  const [visible, setVisible] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={markerRef}
      id={id}
      className={`${visible ? "" : minHeight} ${id ? "scroll-mt-24" : ""}`}
    >
      {visible ? (
        <Suspense fallback={<div className={minHeight} aria-hidden />}>
          {children}
        </Suspense>
      ) : null}
    </div>
  );
}

export default function LandingPage() {
  const { app_name } = useBranding();
  const brand = app_name || "Vendify";

  // FAQ rich results + a Service description so search engines understand what
  // the site offers. The FAQ questions are the same ones the page renders.
  useSeo({
    description: `${brand} — buy airtime and data, and pay electricity, cable TV and exam bills instantly in Nigeria. Instant delivery, low prices, 24/7 support.`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: buildFaqs(brand).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Airtime, data and bill payments",
        provider: { "@type": "Organization", name: brand },
        areaServed: "NG",
      },
    ],
  });

  return (
    <div className="vendify-landing relative min-h-screen overflow-x-hidden font-sans text-slate-900 antialiased">
      <BackgroundField />
      <Navbar />
      <main>
        <Hero />
        <DeferredSection minHeight="min-h-24">
          <TrustedBy />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[540px]">
          <ProductShowcase />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[420px]">
          <Services />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[480px]">
          <WhyVendify />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[420px]">
          <HowItWorks />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[260px]">
          <Stats />
        </DeferredSection>
        <DeferredSection id="pricing" minHeight="min-h-[420px]">
          <Pricing />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[360px]">
          <Testimonials />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[420px]">
          <Faq />
        </DeferredSection>
        <DeferredSection minHeight="min-h-[300px]">
          <FinalCta />
        </DeferredSection>
      </main>
      <DeferredSection minHeight="min-h-[260px]">
        <Footer />
      </DeferredSection>
    </div>
  );
}
