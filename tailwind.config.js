/**
 * MATCHLO — Tokens de design partagés (SOURCE DE VÉRITÉ UNIQUE)
 * ------------------------------------------------------------------
 * Valeurs extraites des écrans Claude Design.
 * Règle d'or : aucune couleur ni espacement écrit en dur dans un écran.
 * Toujours via ces tokens (bg-bg, text-fg, rounded-card...).
 * NativeWind v4 — Expo / React Native.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Mode sombre piloté par classe (et non 'media') : évite l'erreur NativeWind
  // « Cannot manually set color scheme » et nous laisse forcer le thème sombre.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── THÈME SOMBRE (auth, onboarding, talent) ──
        bg: '#0A1224',
        surface: '#15233D',
        'surface-alt': '#1B2C49',
        border: '#26374F',
        fg: '#FFFFFF',
        muted: '#93A1BA',

        // ── COULEURS D'ACTION & STATUTS ──
        primary: '#3B7BF6',
        'primary-dark': '#2D63D6',
        secondary: '#7C5CFF',
        success: '#22C55E',
        warning: '#F5A623',
        danger: '#F43F5E',
        gold: '#F5C518',

        // ── THÈME CLAIR (messages, mission, éval, admin) ──
        'light-bg': '#F4F5F7',
        'light-surface': '#FFFFFF',
        ink: '#0F1B2E',
        'ink-muted': '#64748B',
      },
      spacing: {
        1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
      },
      borderRadius: {
        sm: 10,
        md: 14,
        card: 20,
        lg: 24,
        pill: 9999,
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      // ⚠️ Unités px explicites : sur le web NativeWind émet un lineHeight
      // *sans unité* (= multiplicateur) si on met un nombre, ce qui multiplie
      // par la taille de police (24 → 24×16 = 384px). Les chaînes 'px' donnent
      // un rendu identique sur natif et web.
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '26px' }],
        xl: ['22px', { lineHeight: '30px' }],
        '2xl': ['28px', { lineHeight: '36px' }],
        '3xl': ['34px', { lineHeight: '42px' }],
      },
    },
  },
  plugins: [],
};
