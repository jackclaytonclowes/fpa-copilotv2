import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        ink: {
          DEFAULT: "#0C0E1A",
          50: "#E8E9EF",
          100: "#C5C7D4",
          200: "#9EA1B7",
          300: "#777B9A",
          400: "#585C82",
          500: "#3A3F6B",
          600: "#2A2E55",
          700: "#1B1E3F",
          800: "#0F112A",
          900: "#0C0E1A",
        },
        // Accent: citron (lime-yellow)
        citron: {
          DEFAULT: "#D4F04A",
          50: "#F7FDD5",
          100: "#EDFAAA",
          200: "#DFF46E",
          300: "#D4F04A",
          400: "#BDD923",
          500: "#9AB81A",
          600: "#729112",
          700: "#4E680B",
          800: "#2E4005",
          900: "#141C01",
        },
        // Accent: mint (soft green)
        mint: {
          DEFAULT: "#7EEBC7",
          50: "#F0FDF8",
          100: "#D2FAF0",
          200: "#A8F2E0",
          300: "#7EEBC7",
          400: "#4ADFB0",
          500: "#22CC97",
          600: "#14A87B",
          700: "#0D8460",
          800: "#096047",
          900: "#053D2D",
        },
        // Warm background tones
        cream: {
          DEFAULT: "#F7F3ED",
          50: "#FDFCFA",
          100: "#F7F3ED",
          200: "#EDE5D8",
          300: "#E0D4C1",
          400: "#D0C0A6",
          500: "#BCAA8A",
        },
        sand: {
          DEFAULT: "#E8E0D4",
          100: "#F4F0EA",
          200: "#E8E0D4",
          300: "#D8CEC3",
          400: "#C5B9AA",
          500: "#AFA090",
        },
        // Teal (kept for compatibility + extended)
        teal: {
          50: "#EDF9F8",
          100: "#D0F0ED",
          200: "#A0E2DC",
          300: "#6CCEC6",
          400: "#3BB8AE",
          500: "#189D93",
          600: "#0D7D74",
          700: "#095F58",
          800: "#06433E",
          900: "#032A27",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.2s ease-out",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 240, 74, 0.5)" },
          "50%": { boxShadow: "0 0 0 10px rgba(212, 240, 74, 0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "ink-gradient": "linear-gradient(135deg, #0C0E1A 0%, #1B1E3F 100%)",
        "teal-gradient": "linear-gradient(135deg, #095F58 0%, #0D7D74 100%)",
        "citron-gradient": "linear-gradient(135deg, #D4F04A 0%, #BDD923 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
