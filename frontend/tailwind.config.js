/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SocioTrack Design System Palette
        sociotrack: {
          indigo: "#5146D8",
          "indigo-hover": "#4336c5",
          "indigo-dark": "#3c31b3",
          blue: "#3478F6",
          navy: "#172033",
          canvas: "#F6F7FB",
          card: "#FFFFFF",
          lavender: "#ECE9FF",
          "lavender-light": "#F5F3FF",
          green: "#16A477",
          "green-light": "#E8F8F3",
          secondary: "#718096",
          border: "#E6E9F0",
        },
        background: "#F6F7FB",
        foreground: "#172033",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
        btn: "10px",
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(23, 32, 51, 0.04), 0 1px 3px -1px rgba(23, 32, 51, 0.02)",
        "card-hover": "0 10px 25px -5px rgba(81, 70, 216, 0.08), 0 4px 10px -2px rgba(23, 32, 51, 0.04)",
        dropdown: "0 10px 30px -5px rgba(23, 32, 51, 0.12), 0 4px 12px -2px rgba(23, 32, 51, 0.06)",
        float: "0 20px 40px -10px rgba(81, 70, 216, 0.18), 0 10px 20px -5px rgba(23, 32, 51, 0.08)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.05)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slide-up 0.3s ease-out forwards",
        "fade-in": "fade-in 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};
