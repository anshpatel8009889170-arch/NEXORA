import React from "react";

export default function RestaurantJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexora-restaurant.vercel.app";

  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${baseUrl}/#restaurant`,
    name: "NEXORA Fine Dining & Lounge",
    alternateName: "NEXORA Pure Vegetarian Restaurant",
    description:
      "Luxury 100% pure vegetarian fine dining restaurant and doorstep delivery service located at Sathigva, Amauli-Fatehpur Road. Serving master chef handcrafted delicacies, woodfire creations, rich gravies, and royal desserts.",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    image: [
      `${baseUrl}/logo.png`,
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    ],
    telephone: "+91 98765 43210",
    email: "contact@nexoradining.com",
    priceRange: "₹₹",
    servesCuisine: [
      "North Indian",
      "Pure Vegetarian",
      "Mughlai",
      "Italian",
      "Chinese",
      "Desserts",
    ],
    hasMenu: `${baseUrl}/menu`,
    acceptsReservations: "True",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI, Net Banking, Razorpay",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sathigva, Amauli-Fatehpur Road",
      addressLocality: "Amauli",
      addressRegion: "Uttar Pradesh",
      postalCode: "212631",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "25.9284",
      longitude: "80.4636",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "11:00",
        closes: "23:00",
      },
    ],
    potentialAction: [
      {
        "@type": "OrderAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/menu`,
          inLanguage: "en-IN",
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
          ],
        },
        deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "NEXORA Fine Dining",
    description: "Official online ordering and fine dining portal of NEXORA Restaurant.",
    publisher: {
      "@id": `${baseUrl}/#restaurant`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/menu?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
