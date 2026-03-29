// src/hooks/useTranslation.js
import { useState, useEffect } from 'react';
import { useAppContext } from '../../components/common/AppContext';

export const useTranslation = () => {
  const { language, t: tFromContext, changeLanguage: changeLangFromContext, translations } = useAppContext();
  const [currentTranslations, setCurrentTranslations] = useState(translations);

  useEffect(() => {
    setCurrentTranslations(translations);
  }, [translations]);

  // Lắng nghe sự kiện thay đổi ngôn ngữ từ các component khác
  useEffect(() => {
    const handleLanguageChange = (event) => {
      // Force re-render khi ngôn ngữ thay đổi
      setCurrentTranslations({ ...translations });
    };

    window.addEventListener('languageChange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, [translations]);

  const t = (key, module = 'common') => {
    return tFromContext(key, module);
  };

  const changeLanguage = async (lang) => {
    await changeLangFromContext(lang);
  };

  return { 
    t, 
    language, 
    changeLanguage, 
    translations: currentTranslations 
  };
};