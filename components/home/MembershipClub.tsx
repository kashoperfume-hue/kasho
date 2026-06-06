"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Star, Gem } from "lucide-react";

const tiers = [
  {
    icon: Star,
    name: "Silver",
    spend: "₹5,000+",
    benefits: ["Early access to new arrivals", "5% on every order", "Birthday surprise"],
    color: "bg-beige/40",
    accent: "text-charcoal/60",
    border: "border-beige",
  },
  {
    icon: Crown,
    name: "Gold",
    spend: "₹15,000+",
    benefits: ["Everything in Silver", "10% loyalty discount", "Free shipping always", "VIP customer support"],
    color: "bg-gold/10",
    accent: "text-gold",
    border: "border-gold/40",
    featured: true,
  },
  {
    icon: Gem,
    name: "Platinum",
    spend: "₹30,000+",
    benefits: ["Everything in Gold", "15% loyalty discount", "First access to limited editions", "Complimentary samples with every order"],
    color: "bg-charcoal",
    accent: "text-gold",
    border: "border-charcoal",
    dark: true,
  },
];

export default function MembershipClub() {
  return (
    <section className="section-padding bg-luxury-gradient">
      <div className="page-container">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-label mb-3">Rewards</p>
          <h2 className="font-serif text-4xl lg:text-5xl text-charcoal font-light">
            Kasho Membership Club
          </h2>
          <p className="text-charcoal/50 text-sm mt-3 max-w-md mx-auto">
            Shop and earn points. Level up your tier and unlock exclusive benefits crafted for our most loyal customers.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              className={`border ${tier.border} ${tier.color} p-8 flex flex-col gap-5 relative overflow-hidden ${tier.featured ? "scale-105 shadow-luxury-xl" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              {tier.featured && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-gold text-ink text-[9px] tracking-widest uppercase font-medium">
                  Popular
                </div>
              )}
              <tier.icon size={24} className={tier.accent} />
              <div>
                <h3 className={`font-serif text-2xl font-light ${tier.dark ? "text-cream" : "text-charcoal"}`}>
                  {tier.name}
                </h3>
                <p className={`text-xs ${tier.accent} mt-1 tracking-wider`}>
                  Spend {tier.spend}
                </p>
              </div>
              <ul className="space-y-2 flex-1">
                {tier.benefits.map((b) => (
                  <li
                    key={b}
                    className={`flex items-start gap-2 text-xs ${tier.dark ? "text-cream/60" : "text-charcoal/60"}`}
                  >
                    <span className={`mt-0.5 ${tier.accent}`}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link href="/register" className="btn-primary">
            Join Now — It&apos;s Free
          </Link>
          <p className="text-xs text-charcoal/40 mt-3">
            Automatically enroll when you create an account and make your first purchase.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
