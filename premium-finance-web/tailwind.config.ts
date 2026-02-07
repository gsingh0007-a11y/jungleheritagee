import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        dataset: {
            theme: "data-theme",
        },
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                midnight: {
                    DEFAULT: "#0F172A",
                    50: "#f8fafc",
                    100: "#f1f5f9",
                    200: "#e2e8f0",
                    300: "#cbd5e1",
                    400: "#94a3b8",
                    500: "#64748b",
                    600: "#475569",
                    700: "#334155",
                    800: "#1e293b",
                    900: "#0f172a",
                    950: "#020617",
                },
                charcoal: {
                    DEFAULT: "#1E293B",
                    light: "#334155",
                    dark: "#0F172A",
                },
                emerald: {
                    DEFAULT: "#10B981",
                    dim: "rgba(16, 185, 129, 0.1)",
                    glow: "rgba(16, 185, 129, 0.5)",
                },
                sapphire: {
                    DEFAULT: "#3B82F6",
                    dim: "rgba(59, 130, 246, 0.1)",
                    glow: "rgba(59, 130, 246, 0.5)",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
                heading: ["var(--font-outfit)", "serif"],
            },
            animation: {
                "fade-up": "fade-up 0.5s ease-out forwards",
                "fade-in": "fade-in 0.5s ease-out forwards",
            },
            keyframes: {
                "fade-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
