import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05070a",
          900: "#0a0e14",
          850: "#0e131b",
          800: "#131a24",
          700: "#1c2530",
          600: "#2a3644"
        },
        risk: {
          low: "#34d399",
          moderate: "#fbbf24",
          high: "#fb923c",
          critical: "#f87171"
        },
        accent: {
          DEFAULT: "#34d399",
          dim: "#10b981"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        glow: "0 0 40px -8px rgba(52, 211, 153, 0.45)"
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)"
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
