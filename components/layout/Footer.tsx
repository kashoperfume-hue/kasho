"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const footerLinks = {
  shop: [
    { label: "Men's Collection", href: "/collections/mens" },
    { label: "Women's Collection", href: "/collections/womens" },
    { label: "Unisex", href: "/collections/unisex" },
    { label: "Limited Edition", href: "/collections/limited-edition" },
    { label: "New Arrivals", href: "/products?filter=new" },
    { label: "Best Sellers", href: "/products?filter=bestsellers" },
  ],
  info: [
    { label: "About Kasho", href: "/about" },
    { label: "Our Story", href: "/about#story" },
    { label: "Fragrance Guide", href: "/fragrance-guide" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Your Order", href: "/account/orders" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
    { label: "Shipping Policy", href: "/shipping" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: connect to Supabase newsletter table
    setSubscribed(true);
    toast.success("Welcome to Kasho! Check your inbox.");
    setEmail("");
  };

  return (
    <footer className="bg-ink text-cream/80">
      {/* Newsletter Bar */}
      <div className="border-b border-cream/10">
        <div className="page-container py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <p className="section-label text-gold mb-2">Newsletter</p>
              <h3 className="font-serif text-2xl text-cream font-light">
                Exclusive Offers & New Arrivals
              </h3>
              <p className="text-sm text-cream/50 mt-1">
                Nayi fragrances aur special offers sabse pehle paayein.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="w-full lg:w-auto">
              <div className="flex gap-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 lg:w-72 bg-transparent border border-cream/20 border-r-0 px-5 py-3 text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors text-sm font-sans"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gold text-ink text-sm font-medium tracking-widest uppercase hover:bg-gold/90 transition-colors whitespace-nowrap"
                >
                  {subscribed ? "Subscribed ✓" : "Subscribe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="page-container py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/">
              <span className="font-display text-3xl font-light tracking-[0.3em] text-cream uppercase">
                Kasho
              </span>
            </Link>
            <p className="text-sm text-cream/50 leading-relaxed max-w-xs">
              Crafting premium fragrances that tell your story. Each bottle holds a moment, a memory, a feeling — uniquely yours.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:hello@kasho.in"
                className="flex items-center gap-2 text-sm text-cream/50 hover:text-gold transition-colors"
              >
                <Mail size={14} />
                hello@kasho.in
              </a>
              <a
                href="tel:+91XXXXXXXXXX"
                className="flex items-center gap-2 text-sm text-cream/50 hover:text-gold transition-colors"
              >
                <Phone size={14} />
                +91-XXXXXXXXXX
              </a>
              <p className="flex items-center gap-2 text-sm text-cream/50">
                <MapPin size={14} />
                India
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/kasho.perfumes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream/50 hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold mb-5">
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold mb-5">
              Info
            </h4>
            <ul className="space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-t border-cream/10">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🔒", title: "Secure Payments", desc: "256-bit SSL encryption" },
              { icon: "🚚", title: "Fast Shipping", desc: "2-5 business days" },
              { icon: "↩️", title: "Easy Returns", desc: "15-day return policy" },
              { icon: "✨", title: "100% Authentic", desc: "Genuine fragrances only" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-medium text-cream tracking-wide">
                    {item.title}
                  </p>
                  <p className="text-xs text-cream/40">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream/30">
            © {new Date().getFullYear()} Kasho. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-cream/20">
              Crafted with care in India
            </p>
            <Link
              href="/admin/login"
              className="text-[10px] text-cream/10 hover:text-cream/40 transition-colors tracking-widest uppercase"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
