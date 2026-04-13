import type { DxpTheme } from '@dxp/ui';

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

export const aceTheme: DeepPartial<DxpTheme> = {
  colors: {
    brand: '#D50032',
    brandDark: '#A30027',
    brandLight: '#FFF1F3',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#333333',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
  },
  radius: 'md',
  density: 'comfortable',
};
