/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        body: ['Barlow', 'system-ui', 'sans-serif'],
      },
      colors: {
        verdict: {
          must: '#DC2626',
          worth: '#F59E0B',
          skip: '#64748B',
        },
        gold: '#FBBF24',
      },
    },
  },
  plugins: [],
};
