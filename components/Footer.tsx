"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Globe, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[var(--section-alt)] border-t border-[var(--card-border)] text-[var(--text-sub)] pt-16 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#d4af37]/40">
                <Image
                  src="/logo.jpg"
                  alt="NEXORA Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-serif tracking-[0.25em] text-gold-gradient font-bold">
                NEXORA
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-sub)]">
              Where culinary artistry meets royal hospitality. Experience an unmatchable
              fine-dining journey prepared by our master chefs using the finest ingredients.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[#d4af37]">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/20 hover:border-[#d4af37] transition-all"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/918303890056"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/20 hover:border-[#d4af37] transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Explore
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#d4af37] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-[#d4af37] transition-colors">
                  Signature Menu
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-[#d4af37] transition-colors">
                  Online Ordering
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#d4af37] transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-[var(--text-sub-light)] hover:text-[#d4af37] transition-colors">
                  Staff / Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Opening Hours
            </h3>
            <div className="space-y-2 text-xs text-[var(--text-sub)]">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Monday — Friday</p>
                  <p className="text-[11px] text-[var(--text-sub-light)]">12:00 PM – 11:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <Clock className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Saturday — Sunday</p>
                  <p className="text-[11px] text-[var(--text-sub-light)]">11:30 AM – 12:30 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Location & Contact */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Find Us
            </h3>
            <div className="space-y-2.5 text-xs text-[var(--text-sub)]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <p>Sathigva, Amauli-Fatehpur Road, Near Uday Marriage lone</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a
                  href="tel:+918303890056"
                  className="hover:text-[#d4af37] transition-colors"
                >
                  +91 83038 90056
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a
                  href="mailto:concierge@nexoradining.com"
                  className="hover:text-[#d4af37] transition-colors"
                >
                  concierge@nexoradining.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-sub-light)] gap-3">
          <p>© 2026 NEXORA Fine Dining. All Rights Reserved.</p>
          <p className="tracking-wide">
            Designed & Engineered with Excellence by{" "}
            <span className="text-[#d4af37] font-medium">Ansh Patel</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
