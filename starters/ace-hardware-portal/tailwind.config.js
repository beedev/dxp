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
          50: '#FFF1F3',
          100: '#FFE0E5',
          200: '#FFC7CF',
          300: '#FF9EAD',
          400: '#FF637D',
          500: '#D50032',
          600: '#D50032',
          700: '#A30027',
          800: '#7A001D',
          900: '#520013',
        },
        ace: {
          red: '#D50032',
          redDark: '#A30027',
          charcoal: '#333333',
          green: '#16A34A',
          greenLight: '#DCFCE7',
        },
      },
    },
  },
  plugins: [],
};
