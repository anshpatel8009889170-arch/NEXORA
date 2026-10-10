import type { Metadata, Viewport } from "next";
import "./globals.css";
// Theme-synced layout
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import MobileBottomNav from "@/components/MobileBottomNav";
import FloatingCartBar from "@/components/FloatingCartBar";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "NEXORA | Fine Dining, Gourmet Cuisine & Lounge",
  description:
    "Experience the pinnacle of culinary artistry at NEXORA. Handcrafted gourmet recipes, royal ambience, and doorstep delivery.",
  keywords: ["restaurant", "fine dining", "gourmet food", "NEXORA", "luxury dining"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
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
