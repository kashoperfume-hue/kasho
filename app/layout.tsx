import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Kasho — Premium Perfumes",
    template: "%s | Kasho",
  },
  description:
    "Discover Kasho's curated collection of premium fragrances. Artisan perfumes crafted for the discerning few. Explore our Men's, Women's, Unisex, and Limited Edition collections.",
  keywords: [
    "kasho",
    "premium perfumes",
    "luxury fragrances",
    "artisan perfume",
    "niche fragrance",
    "buy perfume online",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Kasho",
    title: "Kasho — Premium Perfumes",
    description:
      "Discover Kasho's curated collection of premium fragrances.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kasho — Premium Perfumes",
    description:
      "Discover Kasho's curated collection of premium fragrances.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}
    >
      <body className="font-sans bg-cream text-charcoal antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#F8F5F0",
                color: "#3A3630",
                border: "1px solid #E8DED1",
                borderRadius: "0px",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.02em",
              },
              success: {
                iconTheme: {
                  primary: "#C8A46A",
                  secondary: "#F8F5F0",
                },
              },
              error: {
                iconTheme: {
                  primary: "#D9B8B0",
                  secondary: "#F8F5F0",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
