import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMenuItemBySlug, fallbackMenuItems } from "@/lib/menuData";
import FoodDetailClient from "./FoodDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return fallbackMenuItems.map((item) => ({
    slug: item.slug || item.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getMenuItemBySlug(slug);

  if (!item) {
    return {
      title: "Dish Not Found",
      description: "Discover handcrafted culinary delights at NEXORA.",
    };
  }

  const effectivePrice = item.discount_price ?? item.price;
  const dishImage = item.image || item.image_url;

  return {
    title: `${item.name} (₹${effectivePrice})`,
    description: `${item.description} Prepared fresh with royal ingredients at NEXORA. 100% Pure Vegetarian.`,
    keywords: [
      item.name,
      `${item.name} online order`,
      `${item.name} price`,
      "NEXORA signature dish",
      "pure veg restaurant Amauli",
    ],
    openGraph: {
      title: `${item.name} - NEXORA Fine Dining`,
      description: item.description,
      url: `/menu/${item.slug || item.id}`,
      type: "article",
      images: [
        {
          url: dishImage,
          width: 800,
          height: 600,
          alt: item.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.name} | NEXORA Luxury Dining`,
      description: item.description,
      images: [dishImage],
    },
    alternates: {
      canonical: `/menu/${item.slug || item.id}`,
    },
  };
}

export default async function FoodDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getMenuItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexora-restaurant.vercel.app";
  const effectivePrice = item.discount_price ?? item.price;
  const dishImage = item.image || item.image_url;

  // Schema.org MenuItem Structured Data
  const menuItemSchema = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    description: item.description,
    image: dishImage,
    offers: {
      "@type": "Offer",
      price: effectivePrice,
      priceCurrency: "INR",
      availability: item.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Restaurant",
        name: "NEXORA Fine Dining",
        telephone: "+91 98765 43210",
      },
    },
    suitableForDiet: "https://schema.org/VegetarianDiet",
    nutrition: item.calories
      ? {
          "@type": "NutritionInformation",
          calories: `${item.calories} calories`,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuItemSchema) }}
      />
      <FoodDetailClient item={item} />
    </>
  );
}
