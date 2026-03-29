// src/components/LanguageSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaGlobe } from 'react-icons/fa';
import { useAppContext } from '../../components/common/AppContext';
import '../../css/LanguageSelector.css';

const LanguageSelector = () => {
  const { language, changeLanguage, t } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', nameEn: 'Vietnamese' },
    { code: 'en', name: 'English', flag: '🇺🇸', nameEn: 'English' }
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

  const currentLang = languages.find(l => l.code === language);

  // Hiển thị tên ngôn ngữ theo ngôn ngữ hiện tại
  const getLanguageName = (lang) => {
    if (language === 'vi') {
      return lang.name;
    }
    return lang.nameEn || lang.name;
  };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button className="language-btn" onClick={() => setIsOpen(!isOpen)}>
        <FaGlobe />
        <span>{currentLang?.flag} {getLanguageName(currentLang)}</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-name">{getLanguageName(lang)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;