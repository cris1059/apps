/** @type {import('tailwindcss').Config} */
/* Paleta tomada del sitio AvantCode (rama version-2027): monocromática.
   `primary` deja de ser azul y pasa a ser la tinta de la marca, así
   cualquier clase heredada (bg-primary-600, text-primary-700…) queda
   en negro/grises en lugar de azul. */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F7F7F7',
          100: '#F0F0F0',
          200: '#E3E3E3',
          300: '#D2D2D2',
          400: '#9A9A9A',
          500: '#464646',
          600: '#161616',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
        gray: {
          50: '#F7F7F7',
          100: '#F3F3F3',
          200: '#E3E3E3',
          300: '#D2D2D2',
          400: '#9A9A9A',
          500: '#6B6B6B',
          600: '#464646',
          700: '#2E2E2E',
          800: '#222222',
          900: '#141414',
        },
        tinta: {
          DEFAULT: '#141414',
          2: '#464646',
          3: '#6B6B6B',
        },
        negro: {
          DEFAULT: '#161616',
          2: '#222222',
          marco: '#0E0E0E',
        },
        lima: '#D4FF3F',
        teal: {
          50: '#E6F5F2',
          500: '#14A394',
          700: '#0B655D',
        },
        violeta: {
          50: '#EFEAFE',
          400: '#A78BFA',
          600: '#6D3EF0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        suave: '0 1px 2px rgba(0,0,0,.04), 0 10px 30px rgba(0,0,0,.06)',
        flotante: '0 2px 4px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.10)',
      },
      transitionTimingFunction: {
        ac: 'cubic-bezier(.22,.61,.36,1)',
      },
    },
  },
  plugins: [],
}
