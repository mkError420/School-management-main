import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          DEFAULT: "#707E94",
          50: "#f6f7f9",
          100: "#ebedf1",
          200: "#d7dce2",
          300: "#b7c0cc",
          400: "#929eb0",
          500: "#707E94",
          600: "#5a6679",
          700: "#485262",
          800: "#3e4552",
          900: "#363c46",
          950: "#22262d",
        },
        secondary: {
          DEFAULT: "#D32F45",
          50: "#fef2f3",
          100: "#fde2e5",
          200: "#fcc9cf",
          300: "#faa1ac",
          400: "#f56c7d",
          500: "#D32F45",
          600: "#be2035",
          700: "#9f182a",
          800: "#841726",
          900: "#6f1824",
          950: "#3d080f",
        },
        lamaSky: "#707E94",
        lamaSkyLight: "#f4f6f9",
        lamaPurple: "#D32F45",
        lamaPurpleLight: "#fef2f3",
        lamaYellow: "#5a6679",
        lamaYellowLight: "#ebedf1",
      }
    },
  },
  plugins: [],
};
export default config;
