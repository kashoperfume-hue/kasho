"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BrandStory() {
  return (
    <section className="section-padding bg-ink text-cream overflow-hidden">
      <div className="page-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="section-label text-gold mb-6">Our Story</p>
            <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl text-cream font-light leading-tight mb-6">
              Crafted With{" "}
              <em className="not-italic text-gradient-gold">Intention</em>
            </h2>
            <div className="space-y-4 text-cream/60 text-sm leading-relaxed">
              <p>
                Kasho was born from a simple belief: fragrance is not merely a scent — it is an expression, a memory, a feeling captured in glass and worn on skin.
              </p>
              <p>
                We source rare ingredients from around the world and compose each fragrance with the precision of a poet — every note deliberate, every accord a story.
              </p>
              <p>
                From the first spray to the final dry-down, Kasho is designed to be remembered. Not just by you — but by everyone you meet.
              </p>
            </div>
            <div className="flex gap-6 mt-10">
              <Link href="/about" className="btn-outline border-cream/30 text-cream hover:bg-cream hover:text-ink">
                Our Story
              </Link>
              <Link href="/products" className="btn-ghost text-cream hover:text-gold">
                Shop All →
              </Link>
            </div>
          </motion.div>

          {/* Numbers / Visual */}
          <motion.div
            className="grid grid-cols-2 gap-5"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {[
              { num: "2019", label: "Founded", sub: "Year of inception" },
              { num: "50+", label: "Fragrances", sub: "In our catalog" },
              { num: "12", label: "Countries", sub: "Ingredients sourced" },
              { num: "10K+", label: "Customers", sub: "Trust Kasho" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="border border-cream/10 p-7 hover:border-gold/30 transition-colors duration-300"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="font-serif text-3xl text-cream font-light">
                  {stat.num}
                </p>
                <p className="text-xs font-medium tracking-widest uppercase text-gold mt-1">
                  {stat.label}
                </p>
                <p className="text-xs text-cream/30 mt-1">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
