import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gourmet Pure-Veg Menu & Online Ordering",
  description:
    "Explore NEXORA's grand culinary repertoire: royal starters, rich Mughlai & North Indian main courses, woodfire pizzas, sizzling Chinese, and golden desserts. Order online with express delivery.",
  keywords: [
    "NEXORA menu",
    "pure veg menu Sathigva",
    "order food online Amauli",
    "Paneer Tikka price",
    "Dal Bukhara delivery",
    "pure veg food delivery Fatehpur",
  ],
  openGraph: {
    title: "Gourmet Pure-Veg Menu | NEXORA Fine Dining",
    description:
      "Handcrafted starters, charcoal-smoked tikkas, slow-simmered gravies, and artisan desserts prepared fresh to order.",
    url: "/menu",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NEXORA Gourmet Food Menu",
      },
    ],
  },
  alternates: {
    canonical: "/menu",
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
