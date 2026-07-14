import "./styles/landing.css";
import { Navbar } from "./components/navbar";
import { BackgroundField } from "./components/background-field";
import { Hero } from "./components/hero";
import { TrustedBy } from "./components/trusted-by";
import { ProductShowcase } from "./components/product-showcase";
import { Services } from "./components/services";
import { WhyVendify } from "./components/why-vendify";
import { HowItWorks } from "./components/how-it-works";
import { Stats } from "./components/stats";
import { Pricing } from "./components/pricing";
import { Testimonials } from "./components/testimonials";
import { Faq, buildFaqs } from "./components/faq";
import { FinalCta } from "./components/final-cta";
import { Footer } from "./components/footer";
import { useBranding } from "@/shared/branding";
import { useSeo } from "@/shared/seo";

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
      </main>
      <Footer />
    </div>
  );
}
