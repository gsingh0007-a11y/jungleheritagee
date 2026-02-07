"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-midnight-950">
            {/* Background Ambient Animation */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sapphire-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                {/* Parallax Elements (Simulated) */}
                <motion.div
                    style={{ y: y1 }}
                    className="absolute top-20 right-20 w-32 h-32 border border-white/5 rounded-full"
                />
                <motion.div
                    style={{ y: y2 }}
                    className="absolute bottom-20 left-20 w-48 h-48 border border-white/5 rounded-full"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-widest text-emerald-400 uppercase border border-emerald-500/20 rounded-full bg-emerald-500/5 backdrop-blur-sm">
                        Future of Wealth
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8"
                >
                    Quiet <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Confidence.</span>
                    <br />
                    Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-sapphire-400 to-indigo-200">Precision.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed"
                >
                    We architect financial strategies for the world's most demanding enterprises.
                    Experience clarity where others see chaos.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button size="lg" className="group">
                        Begin the Partnership
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button variant="outline" size="lg">
                        Explore Capabilities
                    </Button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-slate-500 to-transparent" />
            </motion.div>
        </section>
    );
}
