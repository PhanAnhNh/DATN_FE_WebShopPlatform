// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { shopApi } from '../../api/api';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app_language');
    return saved || 'vi';
  });
  
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('app_currency');
    return saved || 'VND';
  });
  
  const [translations, setTranslations] = useState({
    common: {},
    shop: {},
    settings: {}
  });

  // Tải translations khi ngôn ngữ thay đổi
  useEffect(() => {
    loadTranslations();
  }, [language]);

  const loadTranslations = async () => {
    try {
      // Tải từng module riêng biệt
      const modules = ['common', 'shop', 'settings'];
      const loadedTranslations = {};
      
      for (const module of modules) {
        try {
          const response = await fetch(`/locales/${language}/${module}.json`);
          if (response.ok) {
            const data = await response.json();
            loadedTranslations[module] = data;
          } else {
            console.warn(`Failed to load ${module}.json for ${language}`);
            loadedTranslations[module] = {};
          }
        } catch (error) {
          console.error(`Error loading ${module}.json:`, error);
          loadedTranslations[module] = {};
        }
      }
      
      setTranslations(loadedTranslations);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const changeLanguage = async (lang) => {
    if (lang === language) return;
    
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    
    // Dispatch event để các component khác cập nhật
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  const changeCurrency = (curr) => {
    setCurrency(curr);
    localStorage.setItem('app_currency', curr);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: curr }));
  };

  // Hàm format số tiền theo currency
  const formatCurrency = (amount) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / 25000);
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Hàm dịch văn bản theo module
  const t = (key, module = 'common') => {
    const keys = key.split('.');
    let value = translations[module];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  };

  const value = {
    language,
    currency,
    translations,
    changeLanguage,
    changeCurrency,
    formatCurrency,
    t
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};