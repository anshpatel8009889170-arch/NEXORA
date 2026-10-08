import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";

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
        <Navbar />
        <div className="flex-1 pt-20">{children}</div>
        <Footer />
        <ThemeToggle />
      </body>
    </html>
  );
}
