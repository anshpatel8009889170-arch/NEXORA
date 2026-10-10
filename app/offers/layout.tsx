import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exclusive Dining Privileges & Coupons",
  description:
    "Unlock exclusive dining discounts, promotional vouchers, and festive coupon codes at NEXORA Pure Vegetarian Fine Dining.",
  keywords: [
    "NEXORA coupons",
    "restaurant promo code",
    "food delivery discount Amauli",
    "fine dining offers Fatehpur",
  ],
  openGraph: {
    title: "Exclusive Offers & Privileges | NEXORA Fine Dining",
    description:
      "Save on royal fine dining and pure-veg doorstep deliveries with seasonal voucher codes and privilege perks.",
    url: "/offers",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "/offers",
  },
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
