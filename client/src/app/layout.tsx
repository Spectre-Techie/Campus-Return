import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Campus Return",
  description: "A secure and practical campus lost-and-found platform with verified claim and handoff flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${manrope.variable} ${sora.variable}`}>
          <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
            <SiteHeader />
            <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">{children}</div>
            <SiteFooter />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
