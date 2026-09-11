/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#E2852E",
        secondary: "#F5B842",
        accent: "#FFEE91",
        info: "#A0D8EB",
        bg: "#FAF8EE",
        txt: "#222222",
        "txt-light": "#666666",
      },
      fontFamily: {
        chelsea: ["ChelseaMarket"],
      },
    },
  },
  plugins: [],
};
