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
            chess: ['"Segoe UI Symbol"', 'Arial', 'sans-serif'], // 'Segoe UI Symbol' renders solid pieces
          },
        },
      },
    plugins: [],
  }
  