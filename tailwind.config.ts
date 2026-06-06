import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F8F5F0",
          50: "#FDFCFA",
          100: "#F8F5F0",
          200: "#EDE8DF",
        },
        beige: {
          DEFAULT: "#E8DED1",
          50: "#F4EFE7",
          100: "#E8DED1",
          200: "#D4C4B0",
          300: "#C0AA8F",
        },
        sage: {
          DEFAULT: "#C8D5C0",
          50: "#E4EDE0",
          100: "#C8D5C0",
          200: "#A8BCA0",
          300: "#88A380",
          600: "#5C7E52",
          700: "#4A6742",
        },
        rose: {
          DEFAULT: "#D9B8B0",
          50: "#F0E4E0",
          100: "#D9B8B0",
          200: "#C49088",
          300: "#AF6860",
        },
        gold: {
          DEFAULT: "#C8A46A",
          50: "#EFE4D0",
          100: "#C8A46A",
          200: "#B08840",
          300: "#8C6B30",
        },
        charcoal: "#3A3630",
        ink: "#1A1714",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.25em",
        "ultra-wide": "0.4em",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        "particle-drift": "particleDrift 4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        particleDrift: {
          "0%, 100%": { transform: "translateY(0) translateX(0) scale(1)", opacity: "0.4" },
          "33%": { transform: "translateY(-20px) translateX(10px) scale(1.1)", opacity: "0.7" },
          "66%": { transform: "translateY(-10px) translateX(-8px) scale(0.9)", opacity: "0.5" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cream-gradient": "linear-gradient(135deg, #F8F5F0 0%, #E8DED1 50%, #F8F5F0 100%)",
        "luxury-gradient": "linear-gradient(180deg, #F8F5F0 0%, #EDE8DF 100%)",
      },
      boxShadow: {
        luxury: "0 4px 24px rgba(58, 54, 48, 0.08)",
        "luxury-lg": "0 8px 48px rgba(58, 54, 48, 0.12)",
        "luxury-xl": "0 16px 64px rgba(58, 54, 48, 0.16)",
        glow: "0 0 30px rgba(200, 164, 106, 0.2)",
        "glow-rose": "0 0 30px rgba(217, 184, 176, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
