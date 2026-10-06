/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F4F7F4',
          100: '#E9EFE9',
          200: '#D3DFD3',
          300: '#ADC4AD',
          400: '#668266',
          500: '#2E4432',
          600: '#263E2B',
          700: '#1F3223',
          800: '#19281C',
          900: '#121D14'
        },
        mint: {
          light: '#F2F6F2',
          DEFAULT: '#E9EFE9',
          card: '#EBF0EA',
          border: '#D9E3D9',
        },
        pearl: '#F8F9F5',
        charcoal: '#1F2421',
        subtitle: '#667068'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
