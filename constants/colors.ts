/**
 * Miroir des tokens couleur (pour usage hors className : StatusBar, gradients,
 * props natives comme tintColor). La source de vérité reste tailwind.config.js.
 */
export const COLORS = {
  bg: '#0A1224',
  surface: '#15233D',
  surfaceAlt: '#1B2C49',
  border: '#26374F',
  fg: '#FFFFFF',
  muted: '#93A1BA',
  primary: '#3B7BF6',
  primaryDark: '#2D63D6',
  secondary: '#7C5CFF',
  success: '#22C55E',
  warning: '#F5A623',
  danger: '#F43F5E',
  gold: '#F5C518',
  lightBg: '#F4F5F7',
  lightSurface: '#FFFFFF',
  ink: '#0F1B2E',
  inkMuted: '#64748B',
} as const;
