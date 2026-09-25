/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode palette
        chiffon: {
          DEFAULT: '#FFF8D2',
          50:  '#FFFEF5',
          100: '#FFFDE8',
          200: '#FFFBD4',
          300: '#FFF8D2',  // main bg
          400: '#FFF3B0',
          500: '#FFED8A',
        },
        moss: {
          DEFAULT: '#84D175',
          50:  '#F0FAF0',
          100: '#D8F3D5',
          200: '#B5E8AF',
          300: '#84D175',  // main accent/button
          400: '#67C456',
          500: '#4FAF3F',
          600: '#3C8B30',
          700: '#2D6A24',
        },
        // Dark mode palette
        space: {
          DEFAULT: '#0C2D45',
          50:  '#E6EDF5',
          100: '#C0D3E6',
          200: '#8AAEC9',
          300: '#5487AA',
          400: '#2D6187',
          500: '#1A4663',
          600: '#0C2D45',  // main dark bg
          700: '#092337',
          800: '#071A28',
          900: '#04111A',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"DM Serif Display"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', '"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
