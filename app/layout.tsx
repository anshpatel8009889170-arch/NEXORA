import type { Metadata, Viewport } from "next";
import "./globals.css";
// Theme-synced layout
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import MobileBottomNav from "@/components/MobileBottomNav";
import FloatingCartBar from "@/components/FloatingCartBar";
import RestaurantJsonLd from "@/components/RestaurantJsonLd";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexora-restaurant.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "NEXORA | Pure Vegetarian Fine Dining & Royal Delivery",
    template: "%s | NEXORA Fine Dining",
  },
  description:
    "Royal pure-vegetarian dining experience at Sathigva, Amauli-Fatehpur Road. Handcrafted gourmet recipes, woodfire pizzas, rich gravies, and 30-35 mins doorstep delivery.",
  keywords: [
    "NEXORA",
    "pure vegetarian restaurant",
    "fine dining Sathigva",
    "Amauli Fatehpur restaurant",
    "gourmet food delivery",
    "pure veg luxury dining",
    "North Indian cuisine",
    "Paneer Tikka",
    "Dal Bukhara",
    "royal dining lounge",
  ],
  authors: [{ name: "Ansh Patel", url: "https://github.com/anshpatel8009889170-arch" }],
  creator: "Ansh Patel",
  publisher: "NEXORA Hospitality",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl,
    siteName: "NEXORA Pure Vegetarian Fine Dining",
    title: "NEXORA | Pure Vegetarian Fine Dining & Royal Delivery",
    description:
      "Luxury pure-veg gastronomy crafted with royal recipes. Handcrafted starters, rich main courses, woodfire pizzas, and royal desserts delivered hot in Sathigva, Amauli-Fatehpur Road.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NEXORA Fine Dining Logo & Signature Ambiance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXORA | Pure Vegetarian Fine Dining & Royal Delivery",
    description:
      "Handcrafted gourmet delicacies, royal ambiance, and doorstep delivery in Sathigva, Amauli-Fatehpur Road.",
    images: ["/logo.png"],
    creator: "@nexoradining",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <RestaurantJsonLd />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[#d4af37] selection:text-black">
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <div className="flex-1 pt-20 pb-20 md:pb-0">{children}</div>
              <FloatingCartBar />
              <Footer />
              <MobileBottomNav />
              <ThemeToggle />
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
