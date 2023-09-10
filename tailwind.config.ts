import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        licorice: {
          600: '#553C3F',
          700: '#402B2D',
          800: '#2A191B',
          900: '#1D1113',
          950: '#0F090A'
        },
        dogwood: '#D8BBAE',
        bittersweet: '#FF6156',
        cinnabar: '#FF4133',
        neonblue: '#656Df0',
        mediumslate: '#737AF1',
        tropicalindigo: '#8086F2'
      }
    },
    fontFamily: {
      ubuntu: ['Ubuntu', 'sans-serif'],
      "ysabeau-office": ['Ysabeau Office', 'sans-serif'],
      "dancing-script": ['Dancing Script', 'cursive']
    }
  },
  plugins: [],
} satisfies Config

