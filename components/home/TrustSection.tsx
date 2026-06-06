"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Truck, RefreshCw, Award } from "lucide-react";

const trust = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "256-bit SSL encryption. Your data is always safe.",
    color: "text-sage-700",
    bg: "bg-sage/20",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    desc: "Delivered across India in 2-5 business days.",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    desc: "Hassle-free 15-day return policy on all products.",
    color: "text-rose",
    bg: "bg-rose/20",
  },
  {
    icon: Award,
    title: "100% Authentic",
    desc: "Every fragrance is genuine, quality guaranteed.",
    color: "text-charcoal",
    bg: "bg-beige/50",
  },
];

export default function TrustSection() {
  return (
    <section className="py-12 bg-beige/30 border-y border-beige/60">
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trust.map((item, i) => (
            <motion.div
              key={item.title}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={`p-3 rounded-none ${item.bg} flex-shrink-0`}>
                <item.icon size={20} className={item.color} />
              </div>
              <div>
                <p className="font-serif text-sm text-charcoal font-medium">
                  {item.title}
                </p>
                <p className="text-xs text-charcoal/50 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
