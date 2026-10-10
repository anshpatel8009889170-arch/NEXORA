import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXORA | Pure Vegetarian Fine Dining & Lounge",
    short_name: "NEXORA",
    description: "Royal pure-vegetarian fine dining and doorstep delivery in Sathigva, Amauli-Fatehpur Road.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#d4af37",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
