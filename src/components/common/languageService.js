// src/i18n/languageService.js
export class LanguageService {
  static instance = null;
  currentLanguage = 'vi';
  translations = {};

  constructor() {
    if (LanguageService.instance) {
      return LanguageService.instance;
    }
    LanguageService.instance = this;
    this.init();
  }

  async init() {
    const savedLang = localStorage.getItem('app_language');
    this.currentLanguage = savedLang || 'vi';
    await this.loadTranslations();
  }

  async loadTranslations() {
    try {
      const modules = ['common', 'shop', 'settings'];
      const translations = {};
      
      for (const module of modules) {
        const response = await fetch(`/locales/${this.currentLanguage}/${module}.json`);
        if (response.ok) {
          const data = await response.json();
          translations[module] = data;
        }
      }
      
      this.translations = translations;
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  async changeLanguage(lang) {
    if (lang === this.currentLanguage) return;
    
    this.currentLanguage = lang;
    localStorage.setItem('app_language', lang);
    await this.loadTranslations();
    
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  }

  t(key, module = 'common') {
    const keys = key.split('.');
    let value = this.translations[module];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value;
  }
}

export const languageService = new LanguageService();