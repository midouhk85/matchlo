import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

export const LANGS = [
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'en', label: 'English', rtl: false },
] as const;

const STORAGE_KEY = 'matchlo.lang';

/** Détecte la langue : préférence stockée → langue de l'appareil → FR. */
function detectLanguage(stored?: string | null): string {
  if (stored && LANGS.some((l) => l.code === stored)) return stored;
  const device = Localization.getLocales()[0]?.languageCode ?? 'fr';
  return LANGS.some((l) => l.code === device) ? device : 'fr';
}

export async function initI18n() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const lng = detectLanguage(stored);

  await i18n.use(initReactI18next).init({
    resources: { fr: { translation: fr }, ar: { translation: ar }, en: { translation: en } },
    lng,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

  applyRTL(lng);
  return i18n;
}

/** Applique la direction RTL pour l'arabe (nécessite un reload pour prendre pleinement effet). */
export function applyRTL(lng: string) {
  const isRTL = LANGS.find((l) => l.code === lng)?.rtl ?? false;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

export async function changeLanguage(lng: string) {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
  applyRTL(lng);
}

export default i18n;
