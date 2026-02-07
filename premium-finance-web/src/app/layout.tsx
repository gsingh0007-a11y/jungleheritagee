import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Corrected import
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Premium Finance | Future of Wealth",
  description: "Experience the next generation of financial consulting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-midnight font-sans text-foreground antialiased selection:bg-emerald-500/30 selection:text-emerald-200",
          inter.variable,
          outfit.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
