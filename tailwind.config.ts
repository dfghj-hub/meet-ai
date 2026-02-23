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
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          hover: "rgba(255, 255, 255, 0.08)",
          active: "rgba(255, 255, 255, 0.12)",
          border: "rgba(255, 255, 255, 0.10)",
        },
      },
      fontFamily: {
        heading: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "gradient-glow": "radial-gradient(600px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(99, 102, 241, 0.15), transparent 40%)",
      },
      animation: {
        "float-slow": "float 20s ease-in-out infinite",
        "float-slower": "float 25s ease-in-out infinite reverse",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "spin-gradient": "spin 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
