"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("You're on the list — welcome to Kasho Circle!");
    setEmail("");
    setLoading(false);
  };

  return (
    <section className="section-padding bg-beige/40">
      <div className="page-container">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-label mb-4">Stay Connected</p>
          <h2 className="font-serif text-4xl lg:text-5xl text-charcoal font-light mb-4">
            Join the Kasho Circle
          </h2>
          <p className="text-charcoal/50 text-sm mb-10">
            Be the first to know about new fragrances, exclusive offers, and behind-the-scenes stories from Kasho.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-cream border border-beige border-r-0 sm:border-r-0 px-5 py-3.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-charcoal text-cream text-xs font-medium tracking-widest uppercase hover:bg-ink transition-colors disabled:opacity-60"
            >
              {loading ? "..." : "Subscribe"}
            </button>
          </form>

          <p className="text-xs text-charcoal/30 mt-4">
            No spam. Unsubscribe anytime. By subscribing you agree to our{" "}
            <a href="/privacy" className="underline hover:text-charcoal">
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}
