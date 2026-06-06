"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroLoaderProps {
  onComplete: () => void;
}

export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2400),
      setTimeout(() => onComplete(), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const particles = Array.from({ length: 18 });

  return (
    <motion.div
      className="intro-loader"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background radial glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-beige/60 via-cream to-cream"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 1 }}
      />

      {/* Smoke / mist layers */}
      <AnimatePresence>
        {phase >= 2 && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full blur-3xl pointer-events-none"
                style={{
                  width: `${200 + i * 80}px`,
                  height: `${200 + i * 80}px`,
                  background: `radial-gradient(circle, rgba(200,164,106,${0.06 - i * 0.01}), transparent 70%)`,
                  left: `${30 + i * 10}%`,
                  top: `${30 + i * 5}%`,
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: [0, 0.8, 0.4],
                  scale: [0.6, 1.4, 1.8],
                  x: [0, (i % 2 === 0 ? 1 : -1) * 30],
                  y: [0, -40],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Perfume bottle silhouette */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            className="absolute"
            style={{ bottom: "20%", left: "50%", x: "-50%" }}
            initial={{ opacity: 0, y: 60, scale: 0.8 }}
            animate={{
              opacity: [0, 0.15, 0.08],
              y: [-10, -30, -50],
              scale: [0.8, 1.1, 1.3],
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
              <rect x="28" y="0" width="24" height="12" rx="2" fill="#C8A46A" opacity="0.5" />
              <rect x="25" y="12" width="30" height="5" rx="1" fill="#C8A46A" opacity="0.6" />
              <path
                d="M15 30 Q10 35 10 50 L10 100 Q10 110 20 110 L60 110 Q70 110 70 100 L70 50 Q70 35 65 30 L50 17 L30 17 Z"
                fill="#C8A46A"
                opacity="0.15"
              />
              <path
                d="M40 17 L50 17 Q65 30 65 50 L65 100 Q65 108 58 108 L40 108"
                fill="#E8C87A"
                opacity="0.1"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating particles */}
      <AnimatePresence>
        {phase >= 3 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  background: `rgba(200, 164, 106, ${0.3 + Math.random() * 0.4})`,
                  left: `${10 + Math.random() * 80}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                initial={{ opacity: 0, y: 20, scale: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: [20, -60 - Math.random() * 60],
                  x: [(Math.random() - 0.5) * 40],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  delay: Math.random() * 0.8,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-display text-5xl sm:text-6xl font-light tracking-[0.5em] text-charcoal uppercase">
            Kasho
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 flex items-center gap-4"
        >
          <div className="w-12 h-px bg-gold/50" />
          <p className="section-label text-gold/80">Wear Your Story</p>
          <div className="w-12 h-px bg-gold/50" />
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="flex gap-1.5 mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-gold/60 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
