
export class CurrencyService {
  static instance = null;
  currentCurrency = 'VND';
  exchangeRate = 27000;

  constructor() {
    if (CurrencyService.instance) {
      return CurrencyService.instance;
    }
    CurrencyService.instance = this;
    this.init();
  }

  init() {
    const saved = localStorage.getItem('app_currency');
    this.currentCurrency = saved || 'VND';
  }

  changeCurrency(currency) {
    this.currentCurrency = currency;
    localStorage.setItem('app_currency', currency);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: currency }));
  }

  format(amount) {
    if (this.currentCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount / this.exchangeRate);
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getSymbol() {
    return this.currentCurrency === 'VND' ? '₫' : '$';
  }
}

export const currencyService = new CurrencyService();