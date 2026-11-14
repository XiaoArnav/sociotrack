const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss/Config')} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // SocioTrack Brand Palette
        "indigo": {
          50: "#F3EFFF",
          100: "#DDDFEE",
          200: "#AEC9FC",
          400: "#8699F6",
          500: "#5146D8", // Brand primary
          700: "#372FA5",
          800: "#2B2287",
          900: "#1E1A6C",
        },
        blue: {
          500: "#3478F6", // Secondary accent
        },
        green: {
          500: "#16A477", // Success/growth
        },
        border: colors.slate[200],
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // Custom spacing scale for consistent design system
      spacing: {
        "64": "16rem",
        "72": "18rem",
      },
    },
  },
  plugins: [],
};
