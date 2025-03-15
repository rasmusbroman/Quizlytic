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
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        'primary-hover': 'var(--primary-hover)',
        'secondary-hover': 'var(--secondary-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'pending': 'var(--pending)',
        'pending-text': 'var(--pending-text)',
      },
    },
  },
  plugins: [],
} satisfies Config;
