// src/hooks/useCurrency.js
import { useState, useEffect } from 'react';
import { useAppContext } from '../../components/common/AppContext';

export const useCurrency = () => {
  const { currency, formatCurrency: formatFromContext, changeCurrency: changeCurrFromContext } = useAppContext();
  const [currentCurrency, setCurrentCurrency] = useState(currency);

  useEffect(() => {
    setCurrentCurrency(currency);
  }, [currency]);

  // Lắng nghe sự kiện thay đổi tiền tệ
  useEffect(() => {
    const handleCurrencyChange = (event) => {
      setCurrentCurrency(event.detail);
    };

    window.addEventListener('currencyChange', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange);
    };
  }, []);

  const formatCurrency = (amount) => {
    return formatFromContext(amount);
  };

  const changeCurrency = (curr) => {
    changeCurrFromContext(curr);
  };

  return { 
    currency: currentCurrency, 
    formatCurrency, 
    changeCurrency 
  };
};