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
        squirrel: {
          light: '#FFFBEB',
          DEFAULT: '#F59E0B',
          dark: '#B45309'
        },
        rhino: {
          light: '#F1F5F9',
          DEFAULT: '#64748B',
          dark: '#334155'
        },
        cat: {
          light: '#FDF2F8',
          DEFAULT: '#EC4899',
          dark: '#BE185D'
        },
        bee: {
          light: '#FEF9C3',
          DEFAULT: '#EAB308',
          dark: '#A16207'
        },
        shark: {
          light: '#EFF6FF',
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8'
        }
      }
    },
  },
  plugins: [],
}
