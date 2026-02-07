import { HeroSection } from "@/components/hero/HeroSection";
import { TrustIndicators } from "@/components/trust/TrustIndicators";
import { NarrativeSection } from "@/components/hero/NarrativeSection";
import { ServicesDeck } from "@/components/services/ServicesDeck";
import { ProofSection } from "@/components/proof/ProofSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-midnight-950 text-white selection:bg-emerald-500/30">
      <HeroSection />
      <TrustIndicators />
      <NarrativeSection />
      <ServicesDeck />
      <ProofSection />

      {/* Final CTA Area */}
      <section className="py-32 flex items-center justify-center bg-midnight-950 border-t border-slate-900">
        <div className="text-center">
          <h2 className="text-4xl font-heading font-bold mb-8">Ready to Ascend?</h2>
          <a href="#" className="inline-block bg-emerald-500 text-midnight-950 font-bold py-4 px-8 rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
            Initiate Contact
          </a>
        </div>
      </section>
    </main>
  );
}

