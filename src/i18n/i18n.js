import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import de from './de.json';
import en from './en.json';
import ru from './ru.json';

const resources = {
  de: { translation: de },
  en: { translation: en },
  ru: { translation: ru },
};

// Try to get system language, fallback to 'de'
const systemLanguage = Localization.locale.split('-')[0];
const defaultLanguage = resources[systemLanguage] ? systemLanguage : 'de';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
