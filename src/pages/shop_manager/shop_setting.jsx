// src/pages/shop/ShopSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaCog, FaBell, FaCreditCard, FaTruck, FaFilePdf, 
  FaLock, FaFacebook, FaGlobe, FaSave, FaSpinner,
  FaCheck, FaExclamationTriangle, FaTimes, FaPlus, FaTrash
} from 'react-icons/fa';
import { shopApi } from '../../api/api';
import { useAppContext } from '../../components/common/AppContext';
import LanguageSelector from '../../components/common/LanguageSelector';
import CurrencySelector from '../../components/common/CurrencySelector';
import '../../css/ShopSettings.css';

const ShopSettings = () => {
  const { t, changeLanguage, changeCurrency, formatCurrency } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shop/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage(t('save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      let endpoint = '';
      let data = {};

      switch(activeTab) {
        case 'general':
          endpoint = '/api/v1/shop/settings/general';
          data = settings.general;
          break;
        case 'notifications':
          endpoint = '/api/v1/shop/settings/notifications';
          data = settings.notifications;
          break;
        case 'payment':
          endpoint = '/api/v1/shop/settings/payment';
          data = settings.payment;
          break;
        case 'shipping':
          endpoint = '/api/v1/shop/settings/shipping';
          data = settings.shipping;
          break;
        case 'security':
          endpoint = '/api/v1/shop/settings/security';
          data = settings.security;
          break;
        case 'invoice':
          endpoint = '/api/v1/shop/settings/invoice';
          data = settings.invoice;
          break;
        case 'social':
          endpoint = '/api/v1/shop/settings/social';
          data = settings.social;
          break;
        case 'seo':
          endpoint = '/api/v1/shop/settings/seo';
          data = settings.seo;
          break;
      }

      await shopApi.put(endpoint, data);
      window.dispatchEvent(new CustomEvent('shopSettingsUpdate'));
      
      if (activeTab === 'general') {
        const shopInfo = JSON.parse(localStorage.getItem('shop_info') || '{}');
        const updatedShopInfo = {
          ...shopInfo,
          name: data.shop_name,
          email: data.shop_email,
          phone: data.shop_phone,
          address: data.shop_address
        };
        localStorage.setItem('shop_info', JSON.stringify(updatedShopInfo));
        window.dispatchEvent(new CustomEvent('shopInfoUpdate', { detail: updatedShopInfo }));
        
        // Cập nhật ngôn ngữ và tiền tệ
        if (data.language) changeLanguage(data.language);
        if (data.currency) changeCurrency(data.currency);
      }
      
      setSuccessMessage(t('save_success'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage(t('save_error'));
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section, updates) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  if (loading) {
    return (
      <div className="shop-settings loading">
        <FaSpinner className="spinning" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="shop-settings error">
        <FaExclamationTriangle />
        <p>{t('save_error')}</p>
        <button onClick={fetchSettings}>{t('retry')}</button>
      </div>
    );
  }

  return (
    <div className="shop-settings">
      <div className="settings-header">
        <h1 className="settings-title">{t('shop_settings', 'shop')}</h1>
        <div className="header-actions">
          <div className="selector-group">
            <LanguageSelector />
            <CurrencySelector />
          </div>
          <button 
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <FaSpinner className="spinning" /> : <FaSave />}
            {t('save_changes')}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert success">
          <FaCheck /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert error">
          <FaExclamationTriangle /> {errorMessage}
        </div>
      )}

      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FaCog /> {t('general', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> {t('notifications', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <FaCreditCard /> {t('payment', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <FaTruck /> {t('shipping', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            <FaFilePdf /> {t('invoice', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaLock /> {t('security', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <FaFacebook /> {t('social_media', 'shop')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <FaGlobe /> {t('seo', 'shop')}
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Tab: Cài đặt chung */}
          {activeTab === 'general' && (
            <div className="settings-panel">
              <h2>{t('general_settings', 'settings')}</h2>
              
              <div className="form-group">
                <label>{t('shop_name', 'shop')}</label>
                <input
                  type="text"
                  value={settings.general.shop_name}
                  onChange={(e) => updateSettings('general', { shop_name: e.target.value })}
                  placeholder={t('shop_name', 'shop')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('email', 'shop')}</label>
                  <input
                    type="email"
                    value={settings.general.shop_email}
                    onChange={(e) => updateSettings('general', { shop_email: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>{t('phone', 'shop')}</label>
                  <input
                    type="tel"
                    value={settings.general.shop_phone}
                    onChange={(e) => updateSettings('general', { shop_phone: e.target.value })}
                    placeholder="1900 1234"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('address', 'shop')}</label>
                <textarea
                  value={settings.general.shop_address}
                  onChange={(e) => updateSettings('general', { shop_address: e.target.value })}
                  rows="2"
                  placeholder={t('address', 'shop')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('tax_code', 'shop')}</label>
                  <input
                    type="text"
                    value={settings.general.tax_code || ''}
                    onChange={(e) => updateSettings('general', { tax_code: e.target.value })}
                    placeholder="0123456789"
                  />
                </div>
                <div className="form-group">
                  <label>{t('website', 'shop')}</label>
                  <input
                    type="url"
                    value={settings.general.website || ''}
                    onChange={(e) => updateSettings('general', { website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('working_hours', 'shop')}</label>
                  <input
                    type="text"
                    value={settings.general.working_hours}
                    onChange={(e) => updateSettings('general', { working_hours: e.target.value })}
                    placeholder="8:00 - 22:00"
                  />
                </div>
                <div className="form-group">
                  <label>{t('timezone', 'shop')}</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => updateSettings('general', { timezone: e.target.value })}
                  >
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('date_format', 'shop')}</label>
                  <select
                    value={settings.general.date_format}
                    onChange={(e) => updateSettings('general', { date_format: e.target.value })}
                  >
                    <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                    <option value="mm/dd/yyyy">mm/dd/yyyy</option>
                    <option value="yyyy-mm-dd">yyyy-mm-dd</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('currency', 'shop')}</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => {
                      updateSettings('general', { currency: e.target.value });
                      changeCurrency(e.target.value);
                    }}
                  >
                    <option value="VND">{t('vnd', 'shop')}</option>
                    <option value="USD">{t('usd', 'shop')}</option>
                  </select>
                </div>
                
              </div>

              {/* Preview currency format */}
              <div className="preview-section">
                <h4>Preview {t('currency', 'shop')}</h4>
                <div className="currency-preview">
                  <span className="preview-label">1,000,000 VND = </span>
                  <span className="preview-value">{formatCurrency(1000000)}</span>
                </div>
                <div className="currency-preview">
                  <span className="preview-label">500,000 VND = </span>
                  <span className="preview-value">{formatCurrency(500000)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Thông báo */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <h2>{t('notifications', 'shop')}</h2>
              
              <div className="settings-section">
                <h3>{t('notification_channels', 'settings')}</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email_notifications}
                      onChange={(e) => updateSettings('notifications', { email_notifications: e.target.checked })}
                    />
                    <span className="toggle-text">{t('email_notifications', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms_notifications}
                      onChange={(e) => updateSettings('notifications', { sms_notifications: e.target.checked })}
                    />
                    <span className="toggle-text">{t('sms_notifications', 'settings')}</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('order_notifications', 'settings')}</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.order_created}
                      onChange={(e) => updateSettings('notifications', { order_created: e.target.checked })}
                    />
                    <span className="toggle-text">{t('order_created', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.order_paid}
                      onChange={(e) => updateSettings('notifications', { order_paid: e.target.checked })}
                    />
                    <span className="toggle-text">{t('order_paid', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.order_shipped}
                      onChange={(e) => updateSettings('notifications', { order_shipped: e.target.checked })}
                    />
                    <span className="toggle-text">{t('order_shipped', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.order_completed}
                      onChange={(e) => updateSettings('notifications', { order_completed: e.target.checked })}
                    />
                    <span className="toggle-text">{t('order_completed', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.order_cancelled}
                      onChange={(e) => updateSettings('notifications', { order_cancelled: e.target.checked })}
                    />
                    <span className="toggle-text">{t('order_cancelled', 'settings')}</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('stock_alerts', 'settings')}</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.low_stock_alert}
                    onChange={(e) => updateSettings('notifications', { low_stock_alert: e.target.checked })}
                  />
                  <span className="toggle-text">{t('low_stock_alert', 'settings')}</span>
                </label>
                {settings.notifications.low_stock_alert && (
                  <div className="form-group">
                    <label>{t('low_stock_threshold', 'settings')}</label>
                    <input
                      type="number"
                      value={settings.notifications.low_stock_threshold}
                      onChange={(e) => updateSettings('notifications', { low_stock_threshold: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                    />
                    <small>{t('low_stock_threshold', 'settings')}</small>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>{t('reports', 'settings')}</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.daily_report}
                      onChange={(e) => updateSettings('notifications', { daily_report: e.target.checked })}
                    />
                    <span className="toggle-text">{t('daily_report', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.weekly_report}
                      onChange={(e) => updateSettings('notifications', { weekly_report: e.target.checked })}
                    />
                    <span className="toggle-text">{t('weekly_report', 'settings')}</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.monthly_report}
                      onChange={(e) => updateSettings('notifications', { monthly_report: e.target.checked })}
                    />
                    <span className="toggle-text">{t('monthly_report', 'settings')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        
        .selector-group {
          display: flex;
          gap: 8px;
          align-items: center;
          background: white;
          padding: 4px 8px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .preview-section {
          margin-top: 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .preview-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #495057;
        }
        
        .currency-preview {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .preview-label {
          color: #6c757d;
        }
        
        .preview-value {
          font-weight: 600;
          color: #2e7d32;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShopSettings;