import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // FIXED: Proper font hierarchy
        heading: ["Charm", "cursive"], // Main headers, GameTable logo
        body: ["Marcellus", "serif"], // Body text, descriptions
        display: ["Charm", "cursive"], // Same as heading for consistency
        elegant: ["Cinzel", "serif"], // Special accent text only
        script: ["Merriweather", "serif"], // Special accent text only
        // Individual font access
        charm: ["Charm", "cursive"],
        marcellus: ["Marcellus", "serif"],
        cinzel: ["Cinzel", "serif"],
        merriweather: ["Merriweather", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        // EXPANDED: Theme-aware color system
        "accent-gold": {
          DEFAULT: "hsl(var(--accent-gold))",
          foreground: "hsl(var(--accent-gold-foreground))",
        },
        "accent-copper": {
          DEFAULT: "hsl(var(--accent-copper))",
          foreground: "hsl(var(--accent-copper-foreground))",
        },
        "surface-dark": {
          DEFAULT: "hsl(var(--surface-dark))",
          foreground: "hsl(var(--surface-dark-foreground))",
        },
        "surface-light": {
          DEFAULT: "hsl(var(--surface-light))",
          foreground: "hsl(var(--surface-light-foreground))",
        },
        "text-contrast": "hsl(var(--text-contrast))",
        // KEEP: Functional colors (hardcoded for recognition)
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)", // Keep red for recognition
          foreground: "hsl(0 0% 98%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)", // Keep amber for recognition
          foreground: "hsl(0 0% 0%)",
        },
        success: {
          DEFAULT: "hsl(142 76% 36%)", // Keep green for recognition
          foreground: "hsl(0 0% 98%)",
        },
        info: {
          DEFAULT: "hsl(217 91% 60%)", // Keep blue for recognition
          foreground: "hsl(0 0% 98%)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Legacy manor colors (can be removed later)
        manor: {
          burgundy: "#8B1538",
          mahogany: "#8B4513",
          gold: "#DAA520",
          cream: "#F5F5DC",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
