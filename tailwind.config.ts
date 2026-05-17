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
        background: "#F8FAFC", // Slate 50
        foreground: "#0F172A", // Slate 900
        primary: {
          DEFAULT: "#2563EB", // Blue 600
          hover: "#1D4ED8",   // Blue 700
          light: "#EFF6FF",   // Blue 50
          dark: "#1E40AF",    // Blue 800
        },
        success: {
          DEFAULT: "#16A34A", // Green 600
          light: "#DCFCE7",   // Green 50
          dark: "#15803D",    // Green 700
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber 500
          light: "#FEF3C7",   // Amber 50
          dark: "#B45309",    // Amber 700
        },
        danger: {
          DEFAULT: "#DC2626", // Red 600
          light: "#FEE2E2",   // Red 50
          dark: "#B91C1C",    // Red 700
        },
      },
    },
  },
  plugins: [],
};
export default config;
