import { useLanguage } from '../contexts/LanguageContext.jsx';

// Convenience hook that provides translation functions
export const useTranslation = () => {
  const { t, currentLanguage, changeLanguage, loading, currentLanguageData } = useLanguage();
  
  return {
    t,
    language: currentLanguage,
    setLanguage: changeLanguage,
    loading,
    languageData: currentLanguageData
  };
};

export default useTranslation;