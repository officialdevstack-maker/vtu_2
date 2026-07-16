import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
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

export default function LandingPage() {
  const { app_name } = useBranding();
  const brand = app_name || "Vendify";
  const [showSecondaryContent, setShowSecondaryContent] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowSecondaryContent(true), 250);
    return () => window.clearTimeout(timeout);
  }, []);

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
        {showSecondaryContent ? (
          <Suspense fallback={<div className="min-h-[40vh]" aria-hidden />}>
            <TrustedBy />
            <ProductShowcase />
            <Services />
            <WhyVendify />
            <HowItWorks />
            <Stats />
            <Pricing />
            <Testimonials />
            <Faq />
            <FinalCta />
          </Suspense>
        ) : (
          <div className="min-h-[40vh]" aria-hidden />
        )}
      </main>
      {showSecondaryContent ? (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      ) : null}
    </div>
  );
}
