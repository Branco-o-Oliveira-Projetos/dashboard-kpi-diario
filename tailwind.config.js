/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#06B6D4',
        bg: '#0F172A',
        bg2: '#1E293B',
        bg3: '#111827',
        text: '#F8FAFC',
        text2: '#94A3B8',
        neonPurple: '#A855F7',
        neonPink: '#EC4899',
        neonCyan: '#06B6D4',
        neonAqua: '#22D3EE'
      }
    },
  },
  plugins: [],
}
