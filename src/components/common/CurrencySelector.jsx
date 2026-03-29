// src/components/CurrencySelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaDollarSign } from 'react-icons/fa';
import { useAppContext } from '../../components/common/AppContext';
import '../../css/CurrencySelector.css';

const CurrencySelector = () => {
  const { currency, changeCurrency } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currencies = [
    { code: 'VND', name: 'Việt Nam Đồng', symbol: '₫', nameEn: 'Vietnamese Dong' },
    { code: 'USD', name: 'US Dollar', symbol: '$', nameEn: 'US Dollar' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCurr = currencies.find(c => c.code === currency);

  return (
    <div className="currency-selector" ref={dropdownRef}>
      <button className="currency-btn" onClick={() => setIsOpen(!isOpen)}>
        <FaDollarSign />
        <span>{currentCurr?.symbol} {currency}</span>
      </button>
      
      {isOpen && (
        <div className="currency-dropdown">
          {currencies.map(curr => (
            <button
              key={curr.code}
              className={`currency-option ${currency === curr.code ? 'active' : ''}`}
              onClick={() => {
                changeCurrency(curr.code);
                setIsOpen(false);
              }}
            >
              <span className="currency-symbol">{curr.symbol}</span>
              <span className="currency-name">{curr.name}</span>
              <span className="currency-code">{curr.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;