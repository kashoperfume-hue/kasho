"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    slug: "mens",
    label: "Men's",
    title: "Pour Homme",
    desc: "Bold, sophisticated fragrances crafted for the modern man.",
    color: "bg-beige/60",
    accentColor: "bg-charcoal",
    textColor: "text-charcoal",
    tagline: "Dark woods. Spice. Depth.",
  },
  {
    slug: "womens",
    label: "Women's",
    title: "Pour Femme",
    desc: "Alluring, luminous scents that define feminine luxury.",
    color: "bg-rose/30",
    accentColor: "bg-rose",
    textColor: "text-charcoal",
    tagline: "Florals. Softness. Radiance.",
  },
  {
    slug: "unisex",
    label: "Unisex",
    title: "Signature",
    desc: "Boundary-defying fragrances for those who transcend labels.",
    color: "bg-sage/40",
    accentColor: "bg-sage-700",
    textColor: "text-charcoal",
    tagline: "Oud. Musk. Freedom.",
  },
  {
    slug: "limited-edition",
    label: "Limited Edition",
    title: "Édition Limitée",
    desc: "Rare masterpieces crafted in small batches. Own a piece of exclusivity.",
    color: "bg-gold/20",
    accentColor: "bg-gold",
    textColor: "text-charcoal",
    tagline: "Rare. Exclusive. Unforgettable.",
  },
];

export default function FeaturedCollections() {
  return (
    <section className="section-padding bg-cream">
      <div className="page-container">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-label mb-3">Explore</p>
          <h2 className="font-serif text-4xl lg:text-5xl text-charcoal font-light">
            Our Collections
          </h2>
          <p className="text-charcoal/50 mt-3 text-sm max-w-md mx-auto">
            Curated for every facet of your identity. Discover the collection that speaks to you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.map((col, i) => (
            <motion.div
              key={col.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link href={`/collections/${col.slug}`} className="group block h-full">
                <div
                  className={`relative ${col.color} p-8 lg:p-10 h-80 lg:h-96 flex flex-col justify-between overflow-hidden transition-all duration-500 group-hover:shadow-luxury-xl`}
                >
                  {/* Background shape */}
                  <motion.div
                    className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full ${col.accentColor} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
                    whileHover={{ scale: 1.2 }}
                  />

                  {/* Content */}
                  <div>
                    <span className="text-[9px] font-medium tracking-ultra-wide uppercase text-charcoal/40">
                      {col.label}
                    </span>
                    <h3 className="font-display text-3xl lg:text-4xl text-charcoal font-light mt-2">
                      {col.title}
                    </h3>
                  </div>

                  <div>
                    <p className="text-xs text-charcoal/50 leading-relaxed mb-4">
                      {col.desc}
                    </p>
                    <p className="text-[10px] tracking-widest uppercase text-charcoal/40 italic mb-6">
                      {col.tagline}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-charcoal group-hover:text-gold transition-colors duration-300">
                      <span>Explore</span>
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-1 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Hover line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
