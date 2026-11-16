import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import ShowcaseSection from "../components/landing/ShowcaseSection";
import ProductTour from "../components/landing/ProductTour";
import TryQuestion from "../components/landing/TryQuestion";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import ForgettingCurve from "../components/landing/ForgettingCurve";
import TestimonialSection from "../components/landing/TestimonialSection";
import PricingSection from "../components/landing/PricingSection";
import FAQSection from "../components/landing/FAQSection";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";
import { ChalkDefs, FormulaTicker } from "../components/landing/backdrop";

const Homepage = () => {
  // The landing page is a dark room; the browser chrome follows while it is on screen.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const previous = meta.content;
    meta.content = "#123A2B";
    return () => { meta.content = previous; };
  }, []);

  return (
    <div className="cine min-h-screen overflow-x-clip">
      <ChalkDefs />
      <Navbar />
      <main>
        <HeroSection />
        <ShowcaseSection />
        <ProductTour />
        <FeaturesSection />
        <FormulaTicker />
        <TryQuestion />
        <HowItWorksSection />
        <ForgettingCurve />
        <TestimonialSection />
        <FormulaTicker reverse />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Homepage;
