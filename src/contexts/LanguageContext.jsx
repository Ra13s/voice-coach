import React, { createContext, useContext, useState, useEffect } from 'react';
import { languages, defaultLanguage, loadLanguage } from '../locales';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  // Initialize language from localStorage or browser
  useEffect(() => {
    const initializeLanguage = () => {
      // Priority: localStorage > browser language > default
      const savedLanguage = localStorage.getItem('voice-coach-language');
      const browserLanguage = navigator.language?.split('-')[0];
      
      let initialLanguage = defaultLanguage;
      
      if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
        initialLanguage = savedLanguage;
      } else if (browserLanguage && languages.some(lang => lang.code === browserLanguage)) {
        initialLanguage = browserLanguage;
      }
      
      setCurrentLanguage(initialLanguage);
    };

    initializeLanguage();
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true);
      try {
        const translations = await loadLanguage(currentLanguage);
        setTranslations(translations);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to default language
        if (currentLanguage !== defaultLanguage) {
          setCurrentLanguage(defaultLanguage);
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  // Change language and persist to localStorage
  const changeLanguage = (languageCode) => {
    if (languages.some(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('voice-coach-language', languageCode);
    }
  };

  // Translation function with nested key support
  const t = (key, variables = {}) => {
    if (loading || !translations.common) {
      return key; // Return key while loading
    }

    // Navigate nested object using dot notation
    const keys = key.split('.');
    let value;
    
    // Check if key starts with 'exercises' to use exercises translations
    if (keys[0] === 'exercises') {
      value = translations.exercises;
      // Remove 'exercises' prefix and navigate the rest
      for (let i = 1; i < keys.length; i++) {
        value = value?.[keys[i]];
        if (value === undefined) break;
      }
    } else {
      // Use common translations
      value = translations.common;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
    }
    
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Simple variable replacement
    let result = value;
    Object.entries(variables).forEach(([varKey, varValue]) => {
      result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
    });

    return result;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    loading,
    languages,
    currentLanguageData: languages.find(lang => lang.code === currentLanguage)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};