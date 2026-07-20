/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#181924',
        panelDark: '#212332',
        accentBlue: '#3a86ff',
        throttleGreen: '#2a9d8f',
        brakeRed: '#e76f51',
        sectorRed: '#9d2a2a',
        sectorGreen: '#2a9d5c',
        sectorPurple: '#8338ec',
        textMuted: '#a0a3b5'
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}