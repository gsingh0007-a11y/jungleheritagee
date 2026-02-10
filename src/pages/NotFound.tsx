import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop"
            alt="Forest wilderness"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 container px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
            <span className="inline-block px-4 py-1.5 border border-gold/40 rounded-full text-gold text-sm uppercase tracking-[0.2em] bg-black/40 backdrop-blur-sm">
              404 Error
            </span>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white tracking-tight">
              Lost in the <br />
              <span className="text-gold italic">Wilderness?</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg mx-auto">
              The page you are looking for seems to have wandered off available paths. Let us guide you back to civilization.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="bg-gold text-white hover:bg-gold-light min-w-[180px] h-14 text-base rounded-full">
                <Link to="/">
                  <Home className="w-5 h-5 mr-2" />
                  Return Home
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white min-w-[180px] h-14 text-base rounded-full bg-transparent">
                <Link to="/contact">
                  <Compass className="w-5 h-5 mr-2" />
                  Contact Us
                </Link>
              </Button>
            </div>

            <div className="pt-12">
              <Button variant="link" asChild className="text-white/60 hover:text-gold transition-colors">
                <Link to="/experiences" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Explore Our Experiences Instead
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
