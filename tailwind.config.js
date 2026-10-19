/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        meridian: {
          50: '#f4f7fb',
          100: '#e8edf6',
          200: '#cbd9ed',
          300: '#9ebedf',
          400: '#6ca0ce',
          500: '#4783bc',
          600: '#3469a2',
          700: '#2b5484',
          800: '#27476e',
          900: '#233d5d',
          950: '#0b131f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
