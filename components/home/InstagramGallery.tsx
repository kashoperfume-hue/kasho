"use client";

import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

// Placeholder gallery using gradient boxes (replace with real images in production)
const placeholders = [
  { id: 1, bg: "bg-gradient-to-br from-beige to-rose/40" },
  { id: 2, bg: "bg-gradient-to-br from-sage/40 to-beige" },
  { id: 3, bg: "bg-gradient-to-br from-gold/20 to-cream" },
  { id: 4, bg: "bg-gradient-to-br from-rose/30 to-beige/60" },
  { id: 5, bg: "bg-gradient-to-br from-beige to-sage/30" },
  { id: 6, bg: "bg-gradient-to-br from-cream to-gold/20" },
];

export default function InstagramGallery() {
  return (
    <section className="section-padding bg-cream">
      <div className="page-container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="section-label mb-3">Social</p>
          <h2 className="font-serif text-4xl lg:text-5xl text-charcoal font-light mb-3">
            #KashoLife
          </h2>
          <a
            href="https://instagram.com/kasho.perfumes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-charcoal/50 hover:text-gold transition-colors"
          >
            <Instagram size={13} />
            @kasho.perfumes
          </a>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 lg:gap-3">
          {placeholders.map((item, i) => (
            <motion.a
              key={item.id}
              href="https://instagram.com/kasho.perfumes"
              target="_blank"
              rel="noopener noreferrer"
              className={`${item.bg} aspect-square group relative overflow-hidden cursor-pointer`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors duration-300 flex items-center justify-center">
                <Instagram
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              {/* Placeholder content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-2xl font-light text-charcoal/20">K</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
