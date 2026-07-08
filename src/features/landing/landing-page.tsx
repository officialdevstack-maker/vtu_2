import "./styles/landing.css";
import { Navbar } from "./components/navbar";
import { BackgroundField } from "./components/background-field";
import { Hero } from "./components/hero";
import { TrustedBy } from "./components/trusted-by";
import { ProductShowcase } from "./components/product-showcase";
import { Services } from "./components/services";
import { WhyKora } from "./components/why-kora";
import { HowItWorks } from "./components/how-it-works";
import { Stats } from "./components/stats";
import { Pricing } from "./components/pricing";
import { Testimonials } from "./components/testimonials";
import { Faq } from "./components/faq";
import { FinalCta } from "./components/final-cta";
import { Footer } from "./components/footer";

export default function LandingPage() {
  return (
    <div className="kora-landing relative min-h-screen overflow-x-hidden font-sans text-slate-900 antialiased">
      <BackgroundField />
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <ProductShowcase />
        <Services />
        <WhyKora />
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
