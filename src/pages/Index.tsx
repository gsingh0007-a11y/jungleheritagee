import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { HighlightsSection } from "@/components/home/HighlightsSection";
import { AboutSnippet } from "@/components/home/AboutSnippet";
import { ExperiencesSection } from "@/components/home/ExperiencesSection";
import { RoomsPreview } from "@/components/home/RoomsPreview";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HighlightsSection />
        <AboutSnippet />
        <ExperiencesSection />
        <RoomsPreview />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
