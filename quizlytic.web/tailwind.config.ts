import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D652D',
        secondary: '#5A9E5A',
        background: '#FAFAF5',
        card: '#FFFFFF',
      },
    },
  },
  plugins: [],
} satisfies Config;
