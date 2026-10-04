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
        carpathian: {
          950: "#06120d",
          900: "#0b2018",
          850: "#0f2b20",
          800: "#143729",
          700: "#1b4d3a",
          600: "#24664d",
        },
        gold: {
          300: "#eed99c",
          400: "#e3c779",
          500: "#d4b358",
          600: "#be9a3e",
          700: "#9f7d2b",
        },
        parchment: {
          50: "#faf8f4",
          100: "#f5f0e6",
          200: "#ebe1cf",
          800: "#36312a",
          900: "#211d18",
        },
      },
      fontFamily: {
        serif: ["var(--font-cinzel)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-8px)" },
          "40%, 80%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
