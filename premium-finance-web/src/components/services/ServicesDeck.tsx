"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const services = [
    {
        title: "Wealth Preservation",
        description: "Safeguarding legacy through multi-generational structures and tax-efficient vehicles.",
        id: "01"
    },
    {
        title: "Strategic Capital",
        description: "Deployment of assets into high-yield, low-volatility private equity and debt markets.",
        id: "02"
    },
    {
        title: "Risk Arbitrage",
        description: "Navigating global volatility to identify asymmetric upside opportunities.",
        id: "03"
    },
    {
        title: "Digital Assets",
        description: "Institutional-grade exposure to blockchain and decentralized finance protocols.",
        id: "04"
    }
];

export function ServicesDeck() {
    return (
        <section className="py-32 bg-midnight-950 text-white">
            <div className="container mx-auto px-4 mb-20">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-heading font-bold mb-6"
                >
                    Capabilities
                </motion.h2>
                <div className="h-1 w-20 bg-emerald-500 rounded-full" />
            </div>

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -10 }}
                            className="group relative p-8 bg-charcoal-light/50 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors duration-300"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ArrowUpRight className="text-emerald-400" />
                            </div>

                            <div className="text-6xl font-bold text-slate-800 mb-12 group-hover:text-slate-700 transition-colors">
                                {service.id}
                            </div>

                            <h3 className="text-2xl font-bold mb-4 font-heading group-hover:text-emerald-400 transition-colors">
                                {service.title}
                            </h3>

                            <p className="text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
