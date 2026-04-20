/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/ai-assistant/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF3C7',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
        },
      },
    },
  },
  plugins: [],
};
