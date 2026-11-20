/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // BHUMI Brand Colors
        earth: {
          50:  "#FDF6F0",
          100: "#FAE8D8",
          200: "#F5CBA7",
          300: "#EDA876",
          400: "#E08244",
          500: "#C4773B",  // Primary terracotta
          600: "#A35E28",
          700: "#82491A",
          800: "#60340F",
          900: "#1A0F0A",  // Deep earth (background)
        },
        gold: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D4A017",  // Warm gold
          600: "#B7860E",
          700: "#926C08",
          800: "#6D5104",
          900: "#453200",
        },
        forest: {
          50:  "#F0F7F4",
          100: "#D8EDE5",
          200: "#A8D4C0",
          300: "#76B89A",
          400: "#4A9B76",
          500: "#2D7D57",  // Deep forest
          600: "#1E6244",
          700: "#124A31",
          800: "#08321F",
          900: "#021A0E",
        },
        cream: "#FAF7F2",
        parchment: "#F0E8D8",
      },
      fontFamily: {
        sans: ["System"],
        serif: ["Georgia"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
