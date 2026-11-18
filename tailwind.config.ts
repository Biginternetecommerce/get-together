import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    baby: "#BFE5F3", blush: "#F6C5DB", lav: "#CBB7EF", mint: "#E4F7EE",
    pearl: "#FFF1DB", orchid: "#B989C7", ocean: "#1B2F5E", champagne: "#E6C98F" },
    fontFamily: { script: ["var(--font-script)", "cursive"], serif: ["var(--font-serif)", "serif"] } } },
  plugins: [],
} satisfies Config;
