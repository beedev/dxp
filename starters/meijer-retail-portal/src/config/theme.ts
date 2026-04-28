import type { DxpTheme } from '@dxp/ui';

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

/**
 * Meijer brand palette. The CSS variable `--dxp-brand` is set from this
 * theme at runtime (via @dxp/ui's ThemeProvider) and that's what every
 * component actually reads. Tailwind's `brand.*` color scale in
 * `tailwind.config.js` is kept aligned with these values.
 */
export const meijerTheme: DeepPartial<DxpTheme> = {
  colors: {
    brand: '#E5202E',
    brandDark: '#C91A26',
    brandLight: '#FEEAEC',
    success: '#16A34A',
    warning: '#F0A91B',
    danger: '#DC2626',
    info: '#1B365D',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
  },
  radius: 'md',
  density: 'comfortable',
};
