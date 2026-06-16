import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amberGold: "#D89A2B",
        deepAmber: "#B97818",
        lightAmber: "#FFF4E0",
        warmWhite: "#FAFAF7",
        charcoal: "#202124",
        softGray: "#6B7280",
        calmGreen: "#3A8B5C",
        softRed: "#D75A4A",
        fieldGreen: "#2F6B4F",
        borderGray: "#E5E1DA"
      }
    }
  },
  plugins: []
};

export default config;
