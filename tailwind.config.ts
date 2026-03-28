import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#dbeafe",
        },
        ink: "#0f172a",
        muted: "#64748b",
        panel: "#ffffff",
        border: "#e2e8f0",
        surface: "#f8fafc",
        success: "#15803d",
        warning: "#b45309",
        danger: "#b91c1c",
      },
      boxShadow: {
        panel: "0 10px 25px -18px rgba(15, 23, 42, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
