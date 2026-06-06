"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    product: "Rose Lumière",
    text: "Absolutely stunning fragrance. I wear it every day and receive compliments constantly. The longevity is impressive — still smelling it 8 hours later. Kasho has a customer for life.",
  },
  {
    id: 2,
    name: "Arjun Mehta",
    location: "Delhi",
    rating: 5,
    product: "Noir Séduction",
    text: "This is the most sophisticated men's fragrance I've worn. Opens with a bang of spice, settles into this incredible woody base. Perfect for evenings. The packaging is beautiful too.",
  },
  {
    id: 3,
    name: "Kavya Reddy",
    location: "Bangalore",
    rating: 5,
    product: "Oud Céleste",
    text: "I was hesitant about an oud fragrance but Oud Céleste won me over completely. It's rich without being overwhelming, with a warmth that feels like a luxury hotel. Worth every penny.",
  },
  {
    id: 4,
    name: "Rohan Gupta",
    location: "Pune",
    rating: 5,
    product: "Verdure Libre",
    text: "Fresh, clean, and surprisingly complex. Verdure Libre is my go-to for daytime. My girlfriend has started stealing it too — that's the best review I can give a unisex fragrance.",
  },
  {
    id: 5,
    name: "Ananya Singh",
    location: "Chennai",
    rating: 5,
    product: "Aurore Blanche",
    text: "Got the Aurore Blanche limited edition as a birthday gift. I was speechless. It's the most delicate, beautiful fragrance — like wearing a cloud. Already ordered a backup before it sells out.",
  },
];

export default function CustomerReviews() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 360 : -360, behavior: "smooth" });
  };

  return (
    <section className="section-padding bg-cream">
      <div className="page-container">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="section-label mb-3">Testimonials</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-charcoal font-light">
              What They Say
            </h2>
          </motion.div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 border border-beige flex items-center justify-center text-charcoal hover:bg-beige/50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 border border-beige flex items-center justify-center text-charcoal hover:bg-beige/50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto hide-scrollbar pb-2"
        >
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              className="flex-shrink-0 w-80 lg:w-96 border border-beige p-8 space-y-5 bg-cream"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Quote size={20} className="text-gold opacity-60" />

              <p className="text-sm text-charcoal/70 leading-relaxed italic">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex">
                {Array.from({ length: 5 }).map((_, si) => (
                  <span
                    key={si}
                    className={si < review.rating ? "star-filled" : "star-empty"}
                  >
                    ★
                  </span>
                ))}
              </div>

              <div className="border-t border-beige/60 pt-4">
                <p className="font-serif text-sm text-charcoal font-medium">
                  {review.name}
                </p>
                <p className="text-xs text-charcoal/40 mt-0.5">
                  {review.location} · <em>{review.product}</em>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
