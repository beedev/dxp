import type { DxpTheme } from '@dxp/ui';

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

/**
 * Meijer demo palette.
 *
 * Picks navy as the *primary* brand surface (the `--dxp-brand` token).
 * Every component that uses `var(--dxp-brand)` — sidebar pills, send
 * button, action highlights, chat bubbles via the chatUserBubble
 * fallback — instantly turns navy. Meijer's red and mustard live in
 * `danger` and `warning` respectively, which gives us the secondary
 * accents (status badges, the dashboard promo banner gradient) that
 * make this *not* look like ACE.
 *
 * Yes, Meijer's real-world brand is red — but red-on-red was visually
 * indistinguishable from ACE. The demo's job is to prove "swap the
 * theme, swap the look", and navy as primary does that in one config
 * line. Real engagements would dial this back to red-primary if the
 * stakeholder cared more about brand authenticity than visual A/B.
 */
export const meijerTheme: DeepPartial<DxpTheme> = {
  colors: {
    brand: '#1B365D',
    brandDark: '#102341',
    brandLight: '#DDE5F2',
    success: '#16A34A',
    warning: '#F0A91B', // Meijer mustard — drives promo accents
    danger: '#E5202E',  // Meijer red — drives error/decline states
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
