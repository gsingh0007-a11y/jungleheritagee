"use client";

import { motion } from "framer-motion";

export function ProofSection() {
    return (
        <section className="py-32 bg-midnight-900 overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">The Data Speaks.</h2>
                        <div className="h-1 w-24 bg-sapphire-500 rounded-full" />
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-400 max-w-md text-right mt-6 md:mt-0"
                    >
                        Our strategies are rigorous, backtested, and proven across market cycles.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Chart 1: Growth Curve */}
                    <div className="bg-charcoal/50 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-200">Portfolio Alpha</h3>
                            <span className="text-emerald-400 font-mono">+24.8%</span>
                        </div>
                        <div className="h-64 relative flex items-end">
                            {/* SVGs with drawing animation */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,250 C50,250 100,200 150,220 C200,240 250,150 300,100 C350,50 400,80 450,40 C500,0 550,20 600,10"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />
                                <motion.path
                                    d="M0,250 C50,250 100,220 150,240 C200,260 250,200 300,180 C350,160 400,170 450,150 C500,130 550,140 600,130"
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                                />
                            </svg>
                            {/* Y-axis labels simulated */}
                            <div className="absolute left-0 bottom-0 top-0 w-full flex flex-col justify-between text-xs text-slate-600 pointer-events-none">
                                <span>+30%</span>
                                <span>+15%</span>
                                <span>0%</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { label: "Assets Under Strategy", value: "$4.2B", color: "text-white" },
                            { label: "Client Retention", value: "98.5%", color: "text-emerald-400" },
                            { label: "Average Tenure", value: "12 Yrs", color: "text-sapphire-400" },
                            { label: "Global Offices", value: "07", color: "text-white" },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="p-6 bg-charcoal/30 border border-slate-800 rounded-xl hover:bg-charcoal/50 transition-colors"
                            >
                                <div className={`text-4xl font-heading font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
