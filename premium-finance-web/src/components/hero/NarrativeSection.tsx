"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function NarrativeSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Transforms for different stages
    const opacityStage1 = useTransform(smoothProgress, [0, 0.3, 0.4], [1, 1, 0]);
    const opacityStage2 = useTransform(smoothProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
    const opacityStage3 = useTransform(smoothProgress, [0.6, 0.7, 1], [0, 1, 1]);

    const scaleStage1 = useTransform(smoothProgress, [0, 0.3], [1, 0.8]);
    const scaleStage2 = useTransform(smoothProgress, [0.3, 0.5], [0.8, 1]);

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-midnight-950">
            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

                {/* Stage 1: Complexity */}
                <motion.div
                    style={{ opacity: opacityStage1, scale: scaleStage1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
                >
                    <div className="absolute inset-0 opacity-20">
                        {/* Chaos Background - Random lines/noise */}
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,50 Q25,25 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-500 animate-pulse" />
                            <path d="M0,30 Q25,80 50,30 T100,80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-600 delay-75" />
                            <path d="M0,70 Q25,10 50,70 T100,10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-700 delay-150" />
                        </svg>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-heading font-bold text-slate-300 mb-6">The Market is Chaos.</h2>
                    <p className="text-xl text-slate-500 max-w-xl">Volatility. Noise. Uncertainty. The signal is lost in the static.</p>
                </motion.div>

                {/* Stage 2: Control */}
                <motion.div
                    style={{ opacity: opacityStage2, scale: scaleStage2 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        {/* Grid Background - Order */}
                        <div className="w-[80%] h-[80%] grid grid-cols-4 grid-rows-4 gap-4">
                            {[...Array(16)].map((_, i) => (
                                <div key={i} className="border border-emerald-500/30 rounded-lg" />
                            ))}
                        </div>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">We Bring Control.</h2>
                    <p className="text-xl text-emerald-100/70 max-w-xl">Precision strategies that align with your objectives. We structure the unstructured.</p>
                </motion.div>

                {/* Stage 3: Growth */}
                <motion.div
                    style={{ opacity: opacityStage3 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-midnight-950 to-midnight-900"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        {/* Ascending Lines - Growth */}
                        <div className="flex gap-8 items-end h-64">
                            <motion.div
                                initial={{ height: 20 }}
                                whileInView={{ height: 100 }}
                                transition={{ duration: 1 }}
                                className="w-12 bg-emerald-500/20 rounded-t-lg"
                            />
                            <motion.div
                                initial={{ height: 40 }}
                                whileInView={{ height: 180 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="w-12 bg-emerald-500/40 rounded-t-lg"
                            />
                            <motion.div
                                initial={{ height: 60 }}
                                whileInView={{ height: 240 }}
                                transition={{ duration: 1.2, delay: 0.4 }}
                                className="w-12 bg-emerald-500/80 rounded-t-lg shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                            />
                        </div>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-heading font-bold text-emerald-400 mb-6 drop-shadow-lg">Exponential clarity.</h2>
                    <p className="text-xl text-white max-w-xl">When the foundation is solid, the only direction is up.</p>
                </motion.div>
            </div>
        </section>
    );
}
