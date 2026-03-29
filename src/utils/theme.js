// src/utils/theme.js
export const applyAdminTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('admin_theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('admin_theme', 'light');
  }
};

export const initAdminTheme = () => {
  const savedTheme = localStorage.getItem('admin_theme');
  if (savedTheme === 'dark') {
    applyAdminTheme('dark');
    return 'dark';
  } else {
    applyAdminTheme('light');
    return 'light';
  }
};

// Dành cho shop
export const applyShopTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme-shop', 'dark');
    localStorage.setItem('shop_theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme-shop', 'light');
    localStorage.setItem('shop_theme', 'light');
  }
};

export const initShopTheme = () => {
  const savedTheme = localStorage.getItem('shop_theme');
  if (savedTheme === 'dark') {
    applyShopTheme('dark');
    return 'dark';
  } else {
    applyShopTheme('light');
    return 'light';
  }
};