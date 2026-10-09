"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Utensils,
  ShieldCheck,
  Flame,
  Star,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Award,
} from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Toast from "@/components/Toast";
import { useCart } from "@/context/CartContext";
import { MenuItem } from "@/types/database";

export default function Home() {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Popular Signature Items (Curated from database)
  const popularDishes: MenuItem[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      category_id: "11111111-1111-1111-1111-111111111111",
      name: "Truffle Malai Paneer Tikka",
      slug: "truffle-malai-paneer-tikka",
      description:
        "Cottage cheese marinated in cashew cream, green cardamom, smoked on clay oven and drizzled with white truffle essence.",
      price: 490,
      discount_price: 440,
      image_url:
        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
      is_veg: true,
      is_vegetarian: true,
      is_available: true,
      is_featured: true,
      spice_level: "mild",
      prep_time_minutes: 18,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      category_id: "22222222-2222-2222-2222-222222222222",
      name: "NEXORA Royal Dal Bukhara",
      slug: "nexora-royal-dal-bukhara",
      description:
        "Black lentils slow-cooked overnight over gentle charcoal embers with fresh cream, churned butter & sun-ripened tomatoes.",
      price: 520,
      discount_price: 470,
      image_url:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
      is_veg: true,
      is_vegetarian: true,
      is_available: true,
      is_featured: true,
      spice_level: "mild",
      prep_time_minutes: 25,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      category_id: "33333333-3333-3333-3333-333333333333",
      name: "Burrata & Truffle Funghi Pizza",
      slug: "burrata-truffle-funghi-pizza",
      description:
        "Handcrafted 48h fermented sourdough crust, San Marzano marinara, wild forest mushrooms, crowned with fresh creamy burrata.",
      price: 680,
      discount_price: 610,
      image_url:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      is_veg: true,
      is_vegetarian: true,
      is_available: true,
      is_featured: true,
      spice_level: "mild",
      prep_time_minutes: 20,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      category_id: "44444444-4444-4444-4444-444444444444",
      name: "24K Gold Leaf Saffron Shahi Tukda",
      slug: "24k-gold-saffron-shahi-tukda",
      description:
        "Royal ghee-fried brioche steeped in saffron rabdi, garnished with pistachios and pure 24-karat edible gold foil.",
      price: 380,
      discount_price: 320,
      image_url:
        "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      is_veg: true,
      is_vegetarian: true,
      is_available: true,
      is_featured: true,
      spice_level: "mild",
      prep_time_minutes: 12,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];

  // Categories Preview
  const categories = [
    { name: "Royal Starters", count: "14 Dishes", tag: "Appetizers" },
    { name: "Chef's Signature Mains", count: "22 Dishes", tag: "Main Course" },
    { name: "Woodfire Gourmet Pizzas", count: "10 Varieties", tag: "Artisan" },
    { name: "Artisanal Desserts & Drinks", count: "16 Delights", tag: "Sweet & Sips" },
  ];

  // Guest Reviews
  const reviews = [
    {
      name: "Vikram Malhotra",
      role: "Food Connoisseur",
      comment:
        "The Truffle Paneer Tikka and Butter Chicken Grand Cru are pure gastronomic magic. Unmatched luxury ambiance and prompt delivery!",
      rating: 5,
    },
    {
      name: "Aanya Singhania",
      role: "Verified Guest",
      comment:
        "NEXORA's 24K Gold Shahi Tukda is by far the finest dessert I have tasted in North India. Truly authentic royal gastronomy.",
      rating: 5,
    },
    {
      name: "Rohit Verma",
      role: "Regular Patron",
      comment:
        "Thermal express delivery arrived steaming hot in exactly 30 minutes. Sourdough pizza crust and packaging are world-class.",
      rating: 5,
    },
  ];

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    setToastMessage(`"${item.name}" added to your royal order!`);
  };

  return (
    <main className="min-h-screen transition-colors duration-200">
      {/* Toast Notification */}
      <Toast
        isOpen={!!toastMessage}
        message={toastMessage || ""}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      {/* ===================================================================
          1. HERO SECTION
          =================================================================== */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 border-b border-[var(--card-border)]">
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-8 py-20">
          {/* Welcome Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/40 text-[#d4af37] text-xs uppercase tracking-[0.3em] font-medium gold-glow-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to NEXORA Luxury Dining</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-[var(--text-main)] leading-[1.15]">
            Where Every Flavour Tells A{" "}
            <span className="text-gold-gradient block mt-2">Royal Story</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--text-sub)] leading-relaxed font-light">
            Authentic food. Handcrafted with Michelin-calibre care, organic farm-sourced heritage spices, and served with royal perfection.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.25em] bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all gold-glow flex items-center justify-center gap-2.5 group shadow-lg"
            >
              <span>View Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.25em] bg-[var(--card-bg)] text-[var(--text-main)] border border-[#d4af37]/40 hover:border-[#d4af37] active:scale-95 transition-all shadow-md"
            >
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. POPULAR ITEMS (CHEF'S SIGNATURE PICKS)
          =================================================================== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
            Chef Recommends
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[var(--text-main)] tracking-tight">
            Popular Signature Dishes
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-lg mx-auto font-light">
            Handpicked crown jewels of our fine-dining kitchen, prepared with time-honored royal perfection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularDishes.map((dish) => (
            <FoodCard
              key={dish.id}
              item={dish}
              quantityInCart={getItemQuantity(dish.id)}
              onAddToCart={handleAddToCart}
              onIncrement={(item) => updateQuantity(item.id, 1)}
              onDecrement={(item) => updateQuantity(item.id, -1)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-widest bg-[var(--card-bg)] border border-[#d4af37]/40 text-[#d4af37] hover:border-[#d4af37] hover:gold-glow-sm transition-all"
          >
            <span>Explore All 24+ Dishes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ===================================================================
          3. CATEGORIES SECTION
          =================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--section-alt)] border-y border-[var(--card-border)] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
              Culinary Selections
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[var(--text-main)] tracking-tight">
              Curated For The Connoisseur
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-lg mx-auto font-light">
              Explore our spectrum of artisanal appetisers, royal curries, woodfire pizzas and golden desserts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[#d4af37] hover:gold-glow-sm transition-all duration-300 flex flex-col justify-between min-h-[190px] shadow-sm"
              >
                <div>
                  <span className="text-[10px] tracking-widest uppercase text-[#d4af37]/90 font-medium">
                    {cat.tag}
                  </span>
                  <h3 className="text-lg font-serif text-[var(--text-main)] group-hover:text-gold-gradient transition-colors mt-2 font-medium">
                    {cat.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-[var(--card-border)]">
                  <span className="text-xs text-[var(--text-sub-light)]">{cat.count}</span>
                  <Link
                    href="/menu"
                    className="text-xs text-[#d4af37] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium"
                  >
                    <span>Browse</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. WHY CHOOSE US (PILLARS)
          =================================================================== */}
      <section className="py-20 bg-[var(--section-alt)] border-b border-[var(--card-border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
              The Gold Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[var(--text-main)] tracking-tight">
              Why Discerning Food Lovers Choose NEXORA
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
                Master Michelin Chefs
              </h3>
              <p className="text-xs text-[var(--text-sub-light)] leading-relaxed font-light">
                Decades of curated gastronomic recipes crafted by veteran culinary maestros.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
                100% Farm Fresh & Pure
              </h3>
              <p className="text-xs text-[var(--text-sub-light)] leading-relaxed font-light">
                Single-origin whole spices, cold-pressed oils, and farm fresh vegetables sourced daily.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
                Thermal Express 35m Delivery
              </h3>
              <p className="text-xs text-[var(--text-sub-light)] leading-relaxed font-light">
                Delivered insulated and oven-hot right to your doorstep within 35 minutes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-[var(--text-main)]">
                5-Star Royal Hospitality
              </h3>
              <p className="text-xs text-[var(--text-sub-light)] leading-relaxed font-light">
                Luxury packaging, eco-friendly gold cutlery, and personalized guest support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. REVIEWS & TESTIMONIALS
          =================================================================== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
            Patron Impressions
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[var(--text-main)] tracking-tight">
            Words From Our Connoisseurs
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-lg mx-auto font-light">
            Read what our esteemed diners and loyal guests have to say about their NEXORA experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* 5 Golden Stars */}
                <div className="flex items-center gap-1 text-[#d4af37]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-sub)] leading-relaxed italic font-light">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--card-border)]">
                <h4 className="text-sm font-serif font-bold text-[var(--text-main)]">
                  {rev.name}
                </h4>
                <p className="text-[11px] text-[#d4af37] uppercase tracking-wider mt-0.5">
                  {rev.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================
          7. LOCATION / HOURS
          =================================================================== */}
      <section id="contact" className="py-20 bg-[var(--section-alt)] border-t border-[var(--card-border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Location & Hours details */}
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
                Visit NEXORA
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[var(--text-main)] leading-tight">
                Experience Grand Ambience & Curated Dining
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-sub)] leading-relaxed font-light">
                Join us for an unforgettable dining evening or order our gourmet dishes directly to your celebration.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[var(--text-main)] font-semibold">
                      Restaurant Address
                    </h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">
                      Sathigva, Amauli-Fatehpur Road, Near Uday Marriage lone
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[var(--text-main)] font-semibold">
                      Operating Hours
                    </h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">
                      Monday — Friday: 12:00 PM – 11:30 PM
                    </p>
                    <p className="text-xs text-[var(--text-sub)]">
                      Saturday — Sunday: 11:30 AM – 12:30 AM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[var(--text-main)] font-semibold">
                      Direct Concierge
                    </h4>
                    <a
                      href="tel:+918303890056"
                      className="text-xs text-[#d4af37] hover:underline mt-0.5 inline-block"
                    >
                      +91 83038 90056
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <a
                  href="https://wa.me/918303890056"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Right: Visual Card with Emblem & Map Teaser */}
            <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl text-center space-y-6 gold-glow-sm">
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden shadow-2xl">
                <Image
                  src="/logo.png"
                  alt="NEXORA Insignia"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-gold-gradient">
                  NEXORA Fine Dining & Lounge
                </h3>
                <p className="text-xs text-[var(--text-sub)]">
                  Amauli-Fatehpur Road, Near Uday Marriage lone, Sathigva
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-xs text-[var(--text-sub)]">
                <p className="text-emerald-400 font-medium">● Open Now for Dine-in & Delivery</p>
                <p className="text-[11px] text-[var(--text-sub-light)] mt-1">Average delivery time: 30–35 mins</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
