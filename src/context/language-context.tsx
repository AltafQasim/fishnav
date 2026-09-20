import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  TRANSLATIONS,
} from '@/i18n/translations';
import { persistentStorage } from '@/services/persistent-storage';

const STORAGE_LANGUAGE_KEY = '@fishnav_app_language_v1';

export type LanguageContextType = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  availableLanguages: LanguageMeta[];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  // 1. Load saved language preference from persistent storage on launch
  useEffect(() => {
    let isMounted = true;
    persistentStorage.getItem(STORAGE_LANGUAGE_KEY).then((saved) => {
      if (isMounted && saved) {
        const matched = SUPPORTED_LANGUAGES.some((l) => l.code === saved);
        if (matched) {
          setLanguageState(saved as SupportedLanguage);
        }
      }
      if (isMounted) setIsReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Change and save language
  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      await persistentStorage.setItem(STORAGE_LANGUAGE_KEY, lang);
    } catch (err) {
      console.warn('[LanguageContext] Error saving language:', err);
    }
  }, []);

  // 3. Translation lookup with automatic fallback to English, then provided fallback, then key
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langDict = TRANSLATIONS[language];
      if (langDict && langDict[key]) {
        return langDict[key];
      }
      const enDict = TRANSLATIONS.en;
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback || key;
    },
    [language],
  );

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages: SUPPORTED_LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
