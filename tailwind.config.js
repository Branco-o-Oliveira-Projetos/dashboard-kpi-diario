/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#06004B',
        bg: '#ffffff',
        bg2: '#f6f8fb',
        text: '#0f172a',
        text2: '#64748b'
      }
    },
  },
  plugins: [],
}
