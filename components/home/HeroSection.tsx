"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";

const particles = Array.from({ length: 24 });

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [mounted, setMounted] = useState(false);

  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  const rotateY = useTransform(springX, [0, 1], [-15, 15]);
  const rotateX = useTransform(springY, [0, 1], [10, -10]);
  const shadowX = useTransform(springX, [0, 1], [-20, 20]);
  const shadowY = useTransform(springY, [0, 1], [-10, 10]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center overflow-hidden bg-luxury-gradient"
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-radial from-beige/60 via-transparent to-transparent" />
      </div>

      {/* Floating ambient particles */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                background: `rgba(${i % 3 === 0 ? "200,164,106" : i % 3 === 1 ? "217,184,176" : "200,213,192"}, ${0.3 + (i % 3) * 0.15})`,
                left: `${5 + (i * 4.1) % 90}%`,
                top: `${10 + (i * 3.7) % 80}%`,
              }}
              animate={{
                y: [0, -(20 + (i % 3) * 15), 0],
                x: [(i % 2 === 0 ? 1 : -1) * (i % 3) * 8, 0, (i % 2 === 0 ? -1 : 1) * (i % 3) * 8],
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4 + (i % 4) * 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      <div className="page-container relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-screen py-24">
          {/* Left — Text content */}
          <div>
            <motion.p
              className="section-label mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Premium Fragrances
            </motion.p>

            <motion.h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-charcoal leading-[1.05] mb-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              Wear
              <br />
              <em className="not-italic text-gradient-gold">Your</em>
              <br />
              Story
            </motion.h1>

            <motion.p
              className="text-base lg:text-lg text-charcoal/60 leading-relaxed mb-10 max-w-md font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              Each Kasho fragrance is a chapter waiting to be written — crafted from rare ingredients, composed with intention, worn with meaning.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
            >
              <Link href="/products" className="btn-primary group flex items-center gap-2">
                Shop Now
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/collections/unisex" className="btn-outline">
                Discover Collection
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex gap-10 mt-14 pt-10 border-t border-beige/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { value: "50+", label: "Fragrances" },
                { value: "4.9★", label: "Avg Rating" },
                { value: "10K+", label: "Happy Customers" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-2xl text-charcoal font-light">{stat.value}</p>
                  <p className="text-xs text-charcoal/40 tracking-widest uppercase mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — 3D Bottle */}
          <div className="flex items-center justify-center relative">
            <motion.div
              style={{ rotateY, rotateX, perspective: 1000 }}
              className="relative cursor-pointer"
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Glow behind bottle */}
              <motion.div
                className="absolute inset-0 -z-10 blur-3xl opacity-40 rounded-full"
                style={{
                  background: "radial-gradient(circle, #C8A46A 0%, #D9B8B0 40%, transparent 70%)",
                  x: shadowX,
                  y: shadowY,
                  scale: 1.5,
                }}
              />

              {/* Bottle SVG */}
              <motion.div
                className="bottle-3d"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg
                  viewBox="0 0 200 320"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-48 sm:w-56 lg:w-64 xl:w-72 drop-shadow-2xl"
                >
                  {/* Cap */}
                  <rect x="72" y="2" width="56" height="28" rx="4" fill="#C8A46A" opacity="0.9" />
                  <rect x="76" y="6" width="48" height="20" rx="2" fill="#E8C87A" opacity="0.4" />

                  {/* Neck */}
                  <rect x="72" y="30" width="56" height="16" rx="2" fill="#3A3630" opacity="0.8" />
                  <rect x="80" y="30" width="40" height="16" fill="#5A5248" opacity="0.3" />

                  {/* Shoulder band */}
                  <path d="M60 46 L140 46 Q160 50 160 70 L160 80 L40 80 Q40 50 60 46Z" fill="#C8A46A" opacity="0.15" />

                  {/* Main bottle body */}
                  <path
                    d="M40 80 Q30 90 30 110 L30 260 Q30 280 50 285 L150 285 Q170 280 170 260 L170 110 Q170 90 160 80 Z"
                    fill="#F8F5F0"
                    stroke="#E8DED1"
                    strokeWidth="1.5"
                  />

                  {/* Glass light reflection */}
                  <path
                    d="M50 90 Q42 100 42 120 L42 250 Q42 265 50 270"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <path
                    d="M55 88 Q48 100 48 125"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.3"
                  />

                  {/* Inner tint */}
                  <path
                    d="M38 88 Q32 98 32 115 L32 258 Q32 272 50 280 L150 280 Q168 272 168 258 L168 115 Q168 98 162 88 L148 80 L52 80Z"
                    fill="url(#bottleGrad)"
                    opacity="0.35"
                  />

                  {/* Label area */}
                  <rect x="55" y="130" width="90" height="110" rx="2" fill="white" opacity="0.8" />
                  <rect x="58" y="133" width="84" height="104" rx="1" fill="#F8F5F0" stroke="#E8DED1" strokeWidth="0.5" />

                  {/* Label content */}
                  <text x="100" y="178" textAnchor="middle" fontFamily="serif" fontSize="14" fill="#3A3630" fontStyle="italic" letterSpacing="3">
                    Kasho
                  </text>
                  <line x1="70" y1="185" x2="130" y2="185" stroke="#C8A46A" strokeWidth="0.5" opacity="0.6" />
                  <text x="100" y="198" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#3A3630" letterSpacing="4" opacity="0.5">
                    PARFUM
                  </text>
                  <text x="100" y="220" textAnchor="middle" fontFamily="sans-serif" fontSize="6.5" fill="#3A3630" opacity="0.4">
                    100 ml
                  </text>

                  {/* Bottom */}
                  <ellipse cx="100" cy="282" rx="65" ry="6" fill="#E8DED1" opacity="0.5" />
                  <ellipse cx="100" cy="282" rx="65" ry="6" fill="url(#shadowGrad)" />

                  {/* Gradient defs */}
                  <defs>
                    <linearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#C8D5C0" />
                      <stop offset="50%" stopColor="#D9B8B0" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#C8A46A" />
                    </linearGradient>
                    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3A3630" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#3A3630" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Spray particles */}
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      background: `rgba(200,164,106,${0.5 - i * 0.04})`,
                    }}
                    animate={{
                      x: [0, (i % 2 === 0 ? 1 : -1) * (8 + i * 5)],
                      y: [0, -(15 + i * 8)],
                      opacity: [0, 0.7, 0],
                      scale: [0.5, 1, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p className="text-[9px] tracking-ultra-wide uppercase text-charcoal/30">Scroll</p>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-transparent via-gold/40 to-transparent"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
