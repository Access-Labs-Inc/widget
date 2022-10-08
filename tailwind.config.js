/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'indigo': {
          50: '#E5EDFF',
          100: '#D1DEFF',
          200: '#B2C8FF',
          300: '#99B5FF',
          400: '#84A7FF',
          500: '#749BFF',
          600: '#5582F6',
          700: '#396EF4',
          800: '#1E4DC7',
          900: '#163480',
        },
      },
    },
  },
  plugins: [],
}
