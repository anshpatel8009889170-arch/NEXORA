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
      title: "Dish Not Found | NEXORA Fine Dining",
      description: "Discover handcrafted culinary delights at NEXORA.",
    };
  }

  return {
    title: `${item.name} | NEXORA Luxury Dining`,
    description: item.description,
    openGraph: {
      title: `${item.name} - NEXORA Fine Dining`,
      description: item.description,
      images: [
        {
          url: item.image || item.image_url,
          width: 800,
          height: 600,
          alt: item.name,
        },
      ],
    },
  };
}

export default async function FoodDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getMenuItemBySlug(slug);

  if (!item) {
    notFound();
  }

  return <FoodDetailClient item={item} />;
}
