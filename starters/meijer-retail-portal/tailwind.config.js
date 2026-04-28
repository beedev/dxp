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
          50:  '#FEEAEC',
          100: '#FDD2D6',
          200: '#FBA4AC',
          300: '#F7777F',
          400: '#F04A55',
          500: '#E5202E',
          600: '#C91A26',
          700: '#A2141E',
          800: '#7B0F17',
          900: '#54090F',
        },
        meijer: {
          red:       '#E5202E',
          redDark:   '#C91A26',
          navy:      '#1B365D',
          navyDark:  '#102341',
          mustard:   '#F0A91B',
          cream:     '#FBF6E9',
          charcoal:  '#1F2937',
          green:     '#16A34A',
          greenLight: '#DCFCE7',
        },
      },
    },
  },
  plugins: [],
};
