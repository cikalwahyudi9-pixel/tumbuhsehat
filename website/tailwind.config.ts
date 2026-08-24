import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#031636",
        "primary-container": "#081b3b",
        "primary-fixed": "#d8e2ff",
        "primary-fixed-dim": "#b6c6ef",
        "on-primary": "#ffffff",
        "on-primary-container": "#7384a9",
        secondary: "#10b981",
        "secondary-container": "#6cf8bb",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00714d",
        amber: "#f59e0b",
        surface: "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "on-surface": "#191c1e",
        "on-surface-variant": "#71787d",
        outline: "#71787d",
        "outline-variant": "#c1c7ce",
        "error": "#ba1a1a",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      maxWidth: {
        "container-max": "1280px",
      },
      spacing: {
        "section-padding": "80px",
        "margin-mobile": "16px",
        gutter: "24px",
      },
    },
  },
  plugins: [],
};
export default config;
