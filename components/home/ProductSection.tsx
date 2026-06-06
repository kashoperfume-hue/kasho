"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface ProductSectionProps {
  label: string;
  title: string;
  products: Product[];
  viewAllHref: string;
  viewAllLabel?: string;
  className?: string;
}

export default function ProductSection({
  label,
  title,
  products,
  viewAllHref,
  viewAllLabel = "View All",
  className = "",
}: ProductSectionProps) {
  if (!products.length) return null;

  return (
    <section className={`section-padding ${className}`}>
      <div className="page-container">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="section-label mb-3">{label}</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-charcoal font-light">
              {title}
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              href={viewAllHref}
              className="hidden sm:flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-charcoal hover:text-gold transition-colors group"
            >
              {viewAllLabel}
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.slice(0, 4).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={i < 2}
            />
          ))}
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link href={viewAllHref} className="btn-outline text-xs">
            {viewAllLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
