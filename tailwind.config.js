/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        winky: ['"Winky Rough"', 'cursive'],
        chess: ['"Segoe UI Symbol"', 'Arial', 'sans-serif'], // Optional
      },
    },
  },
  plugins: [],
};
