"use client";

import { motion } from "framer-motion";

const brands = [
    "Goldman Sachs", "J.P. Morgan", "BlackRock", "Morgan Stanley", "Citi", "Berkshire Hathaway"
];

export function TrustIndicators() {
    return (
        <section className="py-24 bg-midnight-900 overflow-hidden">
            <div className="container mx-auto px-4 mb-12 text-center">
                <p className="text-sm font-medium tracking-widest text-slate-500 uppercase">Trusted by the Global Elite</p>
            </div>

            <div className="relative flex overflow-x-hidden">
                <motion.div
                    className="flex gap-16 whitespace-nowrap"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
                >
                    {[...brands, ...brands].map((brand, index) => (
                        <div key={index} className="flex items-center justify-center min-w-[200px]">
                            <span className="text-2xl font-heading font-semibold text-slate-600 hover:text-white transition-colors duration-300 cursor-default">
                                {brand}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
