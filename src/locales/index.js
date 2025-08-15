// Language configuration
export const languages = [
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇺🇸',
    nativeName: 'English'
  },
  { 
    code: 'et', 
    name: 'Estonian', 
    flag: '🇪🇪',
    nativeName: 'Eesti'
  }
];

export const defaultLanguage = 'en';

// Dynamic imports for lazy loading
export const loadLanguage = async (languageCode) => {
  try {
    const [common, exercises] = await Promise.all([
      import(`./${languageCode}/common.json`),
      import(`./${languageCode}/exercises.json`)
    ]);
    
    return {
      common: common.default,
      exercises: exercises.default
    };
  } catch (error) {
    console.warn(`Failed to load language ${languageCode}:`, error);
    // Fallback to English
    if (languageCode !== 'en') {
      return loadLanguage('en');
    }
    throw error;
  }
};