/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fff5f8',
          100: '#ffe4ec',
          500: '#ff6b9d',
          600: '#e8557e',
        }
      }
    },
  },
  plugins: [],
}
