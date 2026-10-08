import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Utensils, ShieldCheck, Flame } from "lucide-react";

export default function Home() {
  const categories = [
    { name: "Royal Starters", count: "14 Dishes", tag: "Appetizers" },
    { name: "Chef's Signature Mains", count: "22 Dishes", tag: "Main Course" },
    { name: "Woodfire Gourmet Pizzas", count: "10 Varieties", tag: "Artisan" },
    { name: "Artisanal Desserts & Drinks", count: "16 Delights", tag: "Sweet & Sips" },
  ];

  return (
    <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 border-b border-[rgba(212,175,55,0.15)]">
        {/* Subtle Luxury Glow Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#d4af37]/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-8 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141414] border border-[#d4af37]/40 text-[#d4af37] text-xs uppercase tracking-[0.3em] font-medium gold-glow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to NEXORA Luxury Dining</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-[#f5f5f0] leading-[1.15]">
            Where Every Flavour Tells A{" "}
            <span className="text-gold-gradient block mt-2">Royal Story</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#f5f5f0]/70 leading-relaxed font-light">
            Indulge in artisanal gastronomy prepared with time-honored heritage,
            handcrafted by Michelin-calibre master chefs, and served with royal perfection.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.25em] bg-gold-gradient text-black hover:opacity-90 transition-all gold-glow flex items-center justify-center gap-2.5 group"
            >
              <span>Explore Signature Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.25em] bg-[#141414] text-[#f5f5f0] border border-[#d4af37]/40 hover:border-[#d4af37] hover:bg-[#1a1a1a] transition-all"
            >
              Order Online
            </Link>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS / PILLARS BAR */}
      <section className="bg-[#0e0e0e] border-b border-[rgba(212,175,55,0.15)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#141414]/60 border border-[#d4af37]/15">
              <div className="p-3 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-[#f5f5f0]">
                  Master Culinary Chefs
                </h3>
                <p className="text-xs text-[#f5f5f0]/60 mt-0.5">
                  Decades of curated Michelin gastronomic recipes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#141414]/60 border border-[#d4af37]/15">
              <div className="p-3 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-[#f5f5f0]">
                  100% Farm Fresh & Pure
                </h3>
                <p className="text-xs text-[#f5f5f0]/60 mt-0.5">
                  Organic spices and freshest farm produce sourced daily.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#141414]/60 border border-[#d4af37]/15">
              <div className="p-3 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-[#f5f5f0]">
                  Thermal Express Delivery
                </h3>
                <p className="text-xs text-[#f5f5f0]/60 mt-0.5">
                  Delivered oven-hot right to your doorstep in 35 mins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES PREVIEW SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
            Culinary Selections
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#f5f5f0] tracking-tight">
            Curated For The Connoisseur
          </h2>
          <p className="text-xs sm:text-sm text-[#f5f5f0]/60 max-w-lg mx-auto font-light">
            Every dish is designed to tantalize your senses with authentic aromas and royal presentations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="group p-6 rounded-2xl bg-[#121212] border border-[#d4af37]/20 hover:border-[#d4af37] hover:gold-glow-sm transition-all duration-300 flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <span className="text-[10px] tracking-widest uppercase text-[#d4af37]/80">
                  {cat.tag}
                </span>
                <h3 className="text-lg font-serif text-[#f5f5f0] group-hover:text-gold-gradient transition-colors mt-2 font-medium">
                  {cat.name}
                </h3>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-[#d4af37]/10">
                <span className="text-xs text-[#f5f5f0]/50">{cat.count}</span>
                <Link
                  href="/menu"
                  className="text-xs text-[#d4af37] group-hover:translate-x-1 transition-transform flex items-center gap-1"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / LUXURY TEASER */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#080808] border-t border-[rgba(212,175,55,0.15)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-[#d4af37]/40 shadow-2xl shrink-0 gold-glow">
            <Image
              src="/logo.jpg"
              alt="NEXORA Insignia"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-5 text-center md:text-left">
            <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
              The NEXORA Heritage
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#f5f5f0]">
              Dining Transcended Into High Art
            </h2>
            <p className="text-xs sm:text-sm text-[#f5f5f0]/70 leading-relaxed font-light">
              NEXORA was born out of a deep reverence for classical culinary gastronomy and
              progressive luxury dining. From our signature charcoal-grilled preparations to
              our delicate desserts, every plate is a celebration of flavor, texture, and elegance.
            </p>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#d4af37] hover:underline"
              >
                <span>Read our culinary philosophy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
