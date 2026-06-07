import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const color = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: color("--tw-background"),
        foreground: color("--tw-foreground"),
        card: {
          DEFAULT: color("--tw-card"),
          foreground: color("--tw-card-foreground"),
        },
        popover: {
          DEFAULT: color("--tw-popover"),
          foreground: color("--tw-popover-foreground"),
        },
        primary: {
          DEFAULT: color("--tw-primary"),
          foreground: color("--tw-primary-foreground"),
        },
        secondary: {
          DEFAULT: color("--tw-secondary"),
          foreground: color("--tw-secondary-foreground"),
        },
        muted: {
          DEFAULT: color("--tw-muted"),
          foreground: color("--tw-muted-foreground"),
        },
        accent: {
          DEFAULT: color("--tw-accent"),
          foreground: color("--tw-accent-foreground"),
        },
        destructive: {
          DEFAULT: color("--tw-destructive"),
          foreground: color("--tw-destructive-foreground"),
        },
        border: color("--tw-border"),
        input: color("--tw-input"),
        ring: color("--tw-ring"),
        sidebar: {
          DEFAULT: color("--tw-sidebar-background"),
          foreground: color("--tw-sidebar-foreground"),
          primary: color("--tw-sidebar-primary"),
          "primary-foreground": color("--tw-sidebar-primary-foreground"),
          accent: color("--tw-sidebar-accent"),
          "accent-foreground": color("--tw-sidebar-accent-foreground"),
          border: color("--tw-sidebar-border"),
          ring: color("--tw-sidebar-ring"),
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
  plugins: [tailwindcssAnimate],
};

export default config;
