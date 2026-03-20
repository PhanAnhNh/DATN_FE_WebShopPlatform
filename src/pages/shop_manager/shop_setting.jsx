// src/pages/shop/ShopSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaStore,
  FaUser,
  FaBell,
  FaLock,
  FaPalette,
  FaGlobe,
  FaMoneyBillWave,
  FaTruck,
  FaCreditCard,
  FaCog,
  FaSave,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaLanguage,
  FaMoon,
  FaSun,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
  FaQrcode,
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLink,
  FaTrash,
  FaPlus,
  FaEdit,
  FaKey
} from 'react-icons/fa';
import shopApi from '../../api/api';
import '../../css/ShopSettings.css';

const ShopSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State cho từng tab
  const [generalSettings, setGeneralSettings] = useState({
    shopName: 'Đặc Sản Quê Tôi',
    shopEmail: 'shop@dacsanque.com',
    shopPhone: '1900 1234',
    shopAddress: '123 Đường ABC, Quận 1, TP.HCM',
    taxCode: '0123456789',
    website: 'https://dacsanque.com',
    workingHours: '8:00 - 22:00',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'dd/mm/yyyy',
    currency: 'VND',
    language: 'vi'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderCreated: true,
    orderPaid: true,
    orderShipped: true,
    orderCompleted: true,
    orderCancelled: true,
    returnRequested: true,
    returnProcessed: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    newReview: true,
    newCustomer: false,
    dailyReport: true,
    weeklyReport: false,
    monthlyReport: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    cod: true,
    bankTransfer: true,
    momo: false,
    vnpay: false,
    zalopay: false,
    bankAccounts: [
      {
        id: '1',
        bankName: 'Vietcombank',
        accountNumber: '0123456789',
        accountName: 'ĐẶC SẢN QUÊ TÔI',
        branch: 'CN TP.HCM'
      }
    ],
    momoInfo: {
      phone: '0912345678',
      name: 'ĐẶC SẢN QUÊ TÔI'
    },
    autoConfirmPayment: true,
    paymentTimeout: 24 // giờ
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 500000,
    shippingFee: 30000,
    shippingMethods: [
      { id: 'standard', name: 'Giao hàng tiêu chuẩn', fee: 30000, days: '3-5 ngày' },
      { id: 'fast', name: 'Giao hàng nhanh', fee: 50000, days: '1-2 ngày' },
      { id: 'express', name: 'Giao hàng hỏa tốc', fee: 100000, days: 'Trong ngày' }
    ],
    supportedProvinces: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'],
    defaultProvince: 'Hồ Chí Minh',
    allowInternational: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAttempts: 5,
    sessionTimeout: 30, // phút
    passwordExpiry: 90, // ngày
    ipWhitelist: [],
    allowMultipleSessions: true,
    requireStrongPassword: true
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    showLogo: true,
    showTaxCode: true,
    showPhone: true,
    showAddress: true,
    showBankInfo: true,
    invoicePrefix: 'HD',
    invoiceFooter: 'Cảm ơn quý khách đã mua hàng!',
    autoNumbering: true,
    nextInvoiceNumber: 1001,
    printFormat: 'A5',
    emailInvoice: true
  });

  const [socialSettings, setSocialSettings] = useState({
    facebook: 'https://facebook.com/shop',
    instagram: 'https://instagram.com/shop',
    youtube: 'https://youtube.com/shop',
    twitter: 'https://twitter.com/shop',
    whatsapp: '0912345678',
    zalo: '0912345678',
    showSocialLinks: true
  });

  const [seoSettings, setSeoSettings] = useState({
    metaTitle: 'Đặc Sản Quê Tôi - Đặc sản vùng miền chất lượng cao',
    metaDescription: 'Cung cấp đặc sản vùng miền uy tín, chất lượng cao. Giao hàng toàn quốc.',
    metaKeywords: 'đặc sản, quê tôi, đặc sản vùng miền',
    googleAnalytics: 'UA-XXXXX-Y',
    facebookPixel: '123456789',
    allowIndexing: true,
    sitemapEnabled: true
  });

  // Fetch settings from API
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shop/settings');
      // Update states with response data
      // ...
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      // Gửi dữ liệu theo tab đang active
      let data = {};
      switch(activeTab) {
        case 'general':
          data = generalSettings;
          break;
        case 'notifications':
          data = notificationSettings;
          break;
        case 'payment':
          data = paymentSettings;
          break;
        case 'shipping':
          data = shippingSettings;
          break;
        case 'security':
          data = securitySettings;
          break;
        case 'invoice':
          data = invoiceSettings;
          break;
        case 'social':
          data = socialSettings;
          break;
        case 'seo':
          data = seoSettings;
          break;
      }

      await shopApi.put(`/api/v1/shop/settings/${activeTab}`, data);
      setSuccessMessage('Cập nhật cài đặt thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Có lỗi xảy ra khi cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBankAccount = () => {
    setPaymentSettings(prev => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        {
          id: Date.now().toString(),
          bankName: '',
          accountNumber: '',
          accountName: '',
          branch: ''
        }
      ]
    }));
  };

  const handleRemoveBankAccount = (id) => {
    setPaymentSettings(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter(acc => acc.id !== id)
    }));
  };

  const handleBankAccountChange = (id, field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(acc => 
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    }));
  };

  const handleAddIpWhitelist = () => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: [...prev.ipWhitelist, '']
    }));
  };

  const handleIpWhitelistChange = (index, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.map((ip, i) => i === index ? value : ip)
    }));
  };

  const handleRemoveIpWhitelist = (index) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="shop-settings loading">
        <FaSpinner className="spinning" />
        <p>Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="shop-settings">
      <div className="settings-header">
        <h1 className="settings-title">Cài Đặt Hệ Thống</h1>
        <button 
          className="save-btn"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? <FaSpinner className="spinning" /> : <FaSave />}
          Lưu thay đổi
        </button>
      </div>

      {successMessage && (
        <div className="alert success">
          <FaCheck />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert error">
          <FaExclamationTriangle />
          {errorMessage}
        </div>
      )}

      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FaCog /> Cài đặt chung
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Thông báo
          </button>
          <button 
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <FaCreditCard /> Thanh toán
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <FaTruck /> Vận chuyển
          </button>
          <button 
            className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            <FaFilePdf /> Hóa đơn
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaLock /> Bảo mật
          </button>
          <button 
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <FaFacebook /> Mạng xã hội
          </button>
          <button 
            className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <FaGlobe /> SEO
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Tab: Cài đặt chung */}
          {activeTab === 'general' && (
            <div className="settings-panel">
              <h2>Cài đặt chung</h2>
              
              <div className="form-group">
                <label>Tên cửa hàng</label>
                <input
                  type="text"
                  value={generalSettings.shopName}
                  onChange={(e) => setGeneralSettings({...generalSettings, shopName: e.target.value})}
                  placeholder="Nhập tên cửa hàng"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={generalSettings.shopEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, shopEmail: e.target.value})}
                    placeholder="shop@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={generalSettings.shopPhone}
                    onChange={(e) => setGeneralSettings({...generalSettings, shopPhone: e.target.value})}
                    placeholder="1900 1234"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  value={generalSettings.shopAddress}
                  onChange={(e) => setGeneralSettings({...generalSettings, shopAddress: e.target.value})}
                  rows="2"
                  placeholder="Nhập địa chỉ cửa hàng"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mã số thuế</label>
                  <input
                    type="text"
                    value={generalSettings.taxCode}
                    onChange={(e) => setGeneralSettings({...generalSettings, taxCode: e.target.value})}
                    placeholder="0123456789"
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={generalSettings.website}
                    onChange={(e) => setGeneralSettings({...generalSettings, website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giờ làm việc</label>
                  <input
                    type="text"
                    value={generalSettings.workingHours}
                    onChange={(e) => setGeneralSettings({...generalSettings, workingHours: e.target.value})}
                    placeholder="8:00 - 22:00"
                  />
                </div>
                <div className="form-group">
                  <label>Múi giờ</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                  >
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Định dạng ngày</label>
                  <select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
                  >
                    <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                    <option value="mm/dd/yyyy">mm/dd/yyyy</option>
                    <option value="yyyy-mm-dd">yyyy-mm-dd</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tiền tệ</label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                  >
                    <option value="VND">VND - Việt Nam Đồng</option>
                    <option value="USD">USD - Đô la Mỹ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngôn ngữ</label>
                  <select
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Thông báo */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <h2>Cài đặt thông báo</h2>
              
              <div className="settings-section">
                <h3>Kênh thông báo</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                    />
                    <span className="toggle-text">Thông báo qua Email</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                    />
                    <span className="toggle-text">Thông báo qua SMS</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Đơn hàng</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderCreated}
                      onChange={(e) => setNotificationSettings({...notificationSettings, orderCreated: e.target.checked})}
                    />
                    <span className="toggle-text">Khi có đơn hàng mới</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderPaid}
                      onChange={(e) => setNotificationSettings({...notificationSettings, orderPaid: e.target.checked})}
                    />
                    <span className="toggle-text">Khi khách thanh toán</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderShipped}
                      onChange={(e) => setNotificationSettings({...notificationSettings, orderShipped: e.target.checked})}
                    />
                    <span className="toggle-text">Khi giao hàng</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderCompleted}
                      onChange={(e) => setNotificationSettings({...notificationSettings, orderCompleted: e.target.checked})}
                    />
                    <span className="toggle-text">Khi hoàn thành đơn</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderCancelled}
                      onChange={(e) => setNotificationSettings({...notificationSettings, orderCancelled: e.target.checked})}
                    />
                    <span className="toggle-text">Khi hủy đơn</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Đổi trả</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.returnRequested}
                      onChange={(e) => setNotificationSettings({...notificationSettings, returnRequested: e.target.checked})}
                    />
                    <span className="toggle-text">Khi có yêu cầu đổi trả</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.returnProcessed}
                      onChange={(e) => setNotificationSettings({...notificationSettings, returnProcessed: e.target.checked})}
                    />
                    <span className="toggle-text">Khi xử lý đổi trả</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Kho hàng</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.lowStockAlert}
                    onChange={(e) => setNotificationSettings({...notificationSettings, lowStockAlert: e.target.checked})}
                  />
                  <span className="toggle-text">Cảnh báo hết hàng</span>
                </label>
                {notificationSettings.lowStockAlert && (
                  <div className="form-group">
                    <label>Ngưỡng cảnh báo</label>
                    <input
                      type="number"
                      value={notificationSettings.lowStockThreshold}
                      onChange={(e) => setNotificationSettings({...notificationSettings, lowStockThreshold: parseInt(e.target.value)})}
                      min="1"
                      max="100"
                    />
                    <small>Cảnh báo khi số lượng tồn kho dưới mức này</small>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>Đánh giá</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.newReview}
                    onChange={(e) => setNotificationSettings({...notificationSettings, newReview: e.target.checked})}
                  />
                  <span className="toggle-text">Khi có đánh giá mới</span>
                </label>
              </div>

              <div className="settings-section">
                <h3>Báo cáo</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailyReport}
                      onChange={(e) => setNotificationSettings({...notificationSettings, dailyReport: e.target.checked})}
                    />
                    <span className="toggle-text">Báo cáo hàng ngày</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReport}
                      onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReport: e.target.checked})}
                    />
                    <span className="toggle-text">Báo cáo hàng tuần</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.monthlyReport}
                      onChange={(e) => setNotificationSettings({...notificationSettings, monthlyReport: e.target.checked})}
                    />
                    <span className="toggle-text">Báo cáo hàng tháng</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Thanh toán */}
          {activeTab === 'payment' && (
            <div className="settings-panel">
              <h2>Cài đặt thanh toán</h2>
              
              <div className="settings-section">
                <h3>Phương thức thanh toán</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.cod}
                      onChange={(e) => setPaymentSettings({...paymentSettings, cod: e.target.checked})}
                    />
                    <span className="toggle-text">Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.bankTransfer}
                      onChange={(e) => setPaymentSettings({...paymentSettings, bankTransfer: e.target.checked})}
                    />
                    <span className="toggle-text">Chuyển khoản ngân hàng</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.momo}
                      onChange={(e) => setPaymentSettings({...paymentSettings, momo: e.target.checked})}
                    />
                    <span className="toggle-text">Ví MoMo</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.vnpay}
                      onChange={(e) => setPaymentSettings({...paymentSettings, vnpay: e.target.checked})}
                    />
                    <span className="toggle-text">VNPay</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.zalopay}
                      onChange={(e) => setPaymentSettings({...paymentSettings, zalopay: e.target.checked})}
                    />
                    <span className="toggle-text">ZaloPay</span>
                  </label>
                </div>
              </div>

              {paymentSettings.bankTransfer && (
                <div className="settings-section">
                  <div className="section-header">
                    <h3>Tài khoản ngân hàng</h3>
                    <button className="add-btn" onClick={handleAddBankAccount}>
                      <FaPlus /> Thêm tài khoản
                    </button>
                  </div>
                  
                  {paymentSettings.bankAccounts.map((account, index) => (
                    <div key={account.id} className="bank-account-item">
                      <div className="bank-account-header">
                        <h4>Tài khoản {index + 1}</h4>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveBankAccount(account.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Ngân hàng</label>
                          <input
                            type="text"
                            value={account.bankName}
                            onChange={(e) => handleBankAccountChange(account.id, 'bankName', e.target.value)}
                            placeholder="Vietcombank"
                          />
                        </div>
                        <div className="form-group">
                          <label>Số tài khoản</label>
                          <input
                            type="text"
                            value={account.accountNumber}
                            onChange={(e) => handleBankAccountChange(account.id, 'accountNumber', e.target.value)}
                            placeholder="0123456789"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Chủ tài khoản</label>
                          <input
                            type="text"
                            value={account.accountName}
                            onChange={(e) => handleBankAccountChange(account.id, 'accountName', e.target.value)}
                            placeholder="ĐẶC SẢN QUÊ TÔI"
                          />
                        </div>
                        <div className="form-group">
                          <label>Chi nhánh</label>
                          <input
                            type="text"
                            value={account.branch}
                            onChange={(e) => handleBankAccountChange(account.id, 'branch', e.target.value)}
                            placeholder="CN TP.HCM"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paymentSettings.momo && (
                <div className="settings-section">
                  <h3>Thông tin MoMo</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input
                        type="tel"
                        value={paymentSettings.momoInfo.phone}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          momoInfo: {...paymentSettings.momoInfo, phone: e.target.value}
                        })}
                        placeholder="0912345678"
                      />
                    </div>
                    <div className="form-group">
                      <label>Tên chủ ví</label>
                      <input
                        type="text"
                        value={paymentSettings.momoInfo.name}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          momoInfo: {...paymentSettings.momoInfo, name: e.target.value}
                        })}
                        placeholder="ĐẶC SẢN QUÊ TÔI"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="settings-section">
                <h3>Cài đặt khác</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={paymentSettings.autoConfirmPayment}
                    onChange={(e) => setPaymentSettings({...paymentSettings, autoConfirmPayment: e.target.checked})}
                  />
                  <span className="toggle-text">Tự động xác nhận thanh toán</span>
                </label>
                
                <div className="form-group">
                  <label>Thời gian chờ thanh toán (giờ)</label>
                  <input
                    type="number"
                    value={paymentSettings.paymentTimeout}
                    onChange={(e) => setPaymentSettings({...paymentSettings, paymentTimeout: parseInt(e.target.value)})}
                    min="1"
                    max="168"
                  />
                  <small>Hủy đơn nếu không thanh toán sau (giờ)</small>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Vận chuyển */}
          {activeTab === 'shipping' && (
            <div className="settings-panel">
              <h2>Cài đặt vận chuyển</h2>
              
              <div className="settings-section">
                <h3>Phí vận chuyển</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Miễn phí ship cho đơn từ</label>
                    <input
                      type="number"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({...shippingSettings, freeShippingThreshold: parseInt(e.target.value)})}
                      placeholder="500000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phí ship mặc định</label>
                    <input
                      type="number"
                      value={shippingSettings.shippingFee}
                      onChange={(e) => setShippingSettings({...shippingSettings, shippingFee: parseInt(e.target.value)})}
                      placeholder="30000"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Phương thức vận chuyển</h3>
                {shippingSettings.shippingMethods.map((method, index) => (
                  <div key={method.id} className="shipping-method-item">
                    <h4>{method.name}</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phí ship</label>
                        <input
                          type="number"
                          value={method.fee}
                          onChange={(e) => {
                            const newMethods = [...shippingSettings.shippingMethods];
                            newMethods[index].fee = parseInt(e.target.value);
                            setShippingSettings({...shippingSettings, shippingMethods: newMethods});
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Thời gian</label>
                        <input
                          type="text"
                          value={method.days}
                          onChange={(e) => {
                            const newMethods = [...shippingSettings.shippingMethods];
                            newMethods[index].days = e.target.value;
                            setShippingSettings({...shippingSettings, shippingMethods: newMethods});
                          }}
                          placeholder="3-5 ngày"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-section">
                <h3>Khu vực hỗ trợ</h3>
                <div className="form-group">
                  <label>Tỉnh/Thành phố hỗ trợ</label>
                  <select
                    multiple
                    value={shippingSettings.supportedProvinces}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      setShippingSettings({...shippingSettings, supportedProvinces: selected});
                    }}
                    size="5"
                  >
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="An Giang">An Giang</option>
                    <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                  </select>
                  <small>Giữ Ctrl để chọn nhiều</small>
                </div>

                <div className="form-group">
                  <label>Tỉnh/Thành mặc định</label>
                  <select
                    value={shippingSettings.defaultProvince}
                    onChange={(e) => setShippingSettings({...shippingSettings, defaultProvince: e.target.value})}
                  >
                    {shippingSettings.supportedProvinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={shippingSettings.allowInternational}
                    onChange={(e) => setShippingSettings({...shippingSettings, allowInternational: e.target.checked})}
                  />
                  <span className="toggle-text">Cho phép vận chuyển quốc tế</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab: Hóa đơn */}
          {activeTab === 'invoice' && (
            <div className="settings-panel">
              <h2>Cài đặt hóa đơn</h2>
              
              <div className="settings-section">
                <h3>Hiển thị trên hóa đơn</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showLogo}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showLogo: e.target.checked})}
                    />
                    <span className="toggle-text">Hiển thị logo</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showTaxCode}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showTaxCode: e.target.checked})}
                    />
                    <span className="toggle-text">Hiển thị mã số thuế</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showPhone}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showPhone: e.target.checked})}
                    />
                    <span className="toggle-text">Hiển thị số điện thoại</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showAddress}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showAddress: e.target.checked})}
                    />
                    <span className="toggle-text">Hiển thị địa chỉ</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showBankInfo}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showBankInfo: e.target.checked})}
                    />
                    <span className="toggle-text">Hiển thị thông tin ngân hàng</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Đánh số hóa đơn</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tiền tố hóa đơn</label>
                    <input
                      type="text"
                      value={invoiceSettings.invoicePrefix}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, invoicePrefix: e.target.value})}
                      placeholder="HD"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số hóa đơn tiếp theo</label>
                    <input
                      type="number"
                      value={invoiceSettings.nextInvoiceNumber}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, nextInvoiceNumber: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.autoNumbering}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, autoNumbering: e.target.checked})}
                  />
                  <span className="toggle-text">Tự động đánh số</span>
                </label>
              </div>

              <div className="settings-section">
                <h3>Chân trang hóa đơn</h3>
                <textarea
                  value={invoiceSettings.invoiceFooter}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, invoiceFooter: e.target.value})}
                  rows="3"
                  placeholder="Lời cảm ơn, chính sách đổi trả..."
                />
              </div>

              <div className="settings-section">
                <h3>Định dạng in</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kích thước</label>
                    <select
                      value={invoiceSettings.printFormat}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, printFormat: e.target.value})}
                    >
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="A6">A6 (Hóa đơn nhiệt)</option>
                      <option value="80mm">80mm (Máy in nhiệt)</option>
                    </select>
                  </div>
                </div>
              </div>

              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={invoiceSettings.emailInvoice}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, emailInvoice: e.target.checked})}
                />
                <span className="toggle-text">Gửi hóa đơn qua email cho khách</span>
              </label>
            </div>
          )}

          {/* Tab: Bảo mật */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <h2>Cài đặt bảo mật</h2>
              
              <div className="settings-section">
                <h3>Xác thực</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                  />
                  <span className="toggle-text">Bật xác thực hai lớp (2FA)</span>
                </label>
                
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireStrongPassword}
                    onChange={(e) => setSecuritySettings({...securitySettings, requireStrongPassword: e.target.checked})}
                  />
                  <span className="toggle-text">Yêu cầu mật khẩu mạnh</span>
                </label>
                <small>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</small>
              </div>

              <div className="settings-section">
                <h3>Phiên đăng nhập</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Số lần đăng nhập sai tối đa</label>
                    <input
                      type="number"
                      value={securitySettings.loginAttempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, loginAttempts: parseInt(e.target.value)})}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời gian hết phiên (phút)</label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                      min="5"
                      max="480"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Thời hạn mật khẩu (ngày)</label>
                  <input
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                    min="0"
                    max="365"
                  />
                  <small>0 = không bao giờ hết hạn</small>
                </div>

                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={securitySettings.allowMultipleSessions}
                    onChange={(e) => setSecuritySettings({...securitySettings, allowMultipleSessions: e.target.checked})}
                  />
                  <span className="toggle-text">Cho phép đăng nhập nhiều nơi</span>
                </label>
              </div>

              <div className="settings-section">
                <div className="section-header">
                  <h3>IP Whitelist</h3>
                  <button className="add-btn" onClick={handleAddIpWhitelist}>
                    <FaPlus /> Thêm IP
                  </button>
                </div>
                
                {securitySettings.ipWhitelist.map((ip, index) => (
                  <div key={index} className="ip-item">
                    <input
                      type="text"
                      value={ip}
                      onChange={(e) => handleIpWhitelistChange(index, e.target.value)}
                      placeholder="192.168.1.1"
                    />
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveIpWhitelist(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <small>Chỉ cho phép đăng nhập từ các IP này (để trống nếu không giới hạn)</small>
              </div>
            </div>
          )}

          {/* Tab: Mạng xã hội */}
          {activeTab === 'social' && (
            <div className="settings-panel">
              <h2>Kết nối mạng xã hội</h2>
              
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={socialSettings.showSocialLinks}
                  onChange={(e) => setSocialSettings({...socialSettings, showSocialLinks: e.target.checked})}
                />
                <span className="toggle-text">Hiển thị liên kết mạng xã hội trên trang</span>
              </label>

              <div className="social-links">
                <div className="form-group">
                  <label><FaFacebook /> Facebook</label>
                  <input
                    type="url"
                    value={socialSettings.facebook}
                    onChange={(e) => setSocialSettings({...socialSettings, facebook: e.target.value})}
                    placeholder="https://facebook.com/shop"
                  />
                </div>

                <div className="form-group">
                  <label><FaInstagram /> Instagram</label>
                  <input
                    type="url"
                    value={socialSettings.instagram}
                    onChange={(e) => setSocialSettings({...socialSettings, instagram: e.target.value})}
                    placeholder="https://instagram.com/shop"
                  />
                </div>

                <div className="form-group">
                  <label><FaYoutube /> YouTube</label>
                  <input
                    type="url"
                    value={socialSettings.youtube}
                    onChange={(e) => setSocialSettings({...socialSettings, youtube: e.target.value})}
                    placeholder="https://youtube.com/shop"
                  />
                </div>

                <div className="form-group">
                  <label><FaTwitter /> Twitter</label>
                  <input
                    type="url"
                    value={socialSettings.twitter}
                    onChange={(e) => setSocialSettings({...socialSettings, twitter: e.target.value})}
                    placeholder="https://twitter.com/shop"
                  />
                </div>

                <div className="form-group">
                  <label><FaWhatsapp /> WhatsApp</label>
                  <input
                    type="tel"
                    value={socialSettings.whatsapp}
                    onChange={(e) => setSocialSettings({...socialSettings, whatsapp: e.target.value})}
                    placeholder="0912345678"
                  />
                </div>

                <div className="form-group">
                  <label>Zalo</label>
                  <input
                    type="tel"
                    value={socialSettings.zalo}
                    onChange={(e) => setSocialSettings({...socialSettings, zalo: e.target.value})}
                    placeholder="0912345678"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: SEO */}
          {activeTab === 'seo' && (
            <div className="settings-panel">
              <h2>Cài đặt SEO</h2>
              
              <div className="settings-section">
                <h3>Meta tags</h3>
                <div className="form-group">
                  <label>Meta Title</label>
                  <input
                    type="text"
                    value={seoSettings.metaTitle}
                    onChange={(e) => setSeoSettings({...seoSettings, metaTitle: e.target.value})}
                    placeholder="Tiêu đề trang"
                  />
                  <small>Tối ưu 50-60 ký tự</small>
                </div>

                <div className="form-group">
                  <label>Meta Description</label>
                  <textarea
                    value={seoSettings.metaDescription}
                    onChange={(e) => setSeoSettings({...seoSettings, metaDescription: e.target.value})}
                    rows="3"
                    placeholder="Mô tả trang"
                  />
                  <small>Tối ưu 150-160 ký tự</small>
                </div>

                <div className="form-group">
                  <label>Meta Keywords</label>
                  <input
                    type="text"
                    value={seoSettings.metaKeywords}
                    onChange={(e) => setSeoSettings({...seoSettings, metaKeywords: e.target.value})}
                    placeholder="từ khóa, cách nhau bằng dấu phẩy"
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3>Theo dõi</h3>
                <div className="form-group">
                  <label>Google Analytics ID</label>
                  <input
                    type="text"
                    value={seoSettings.googleAnalytics}
                    onChange={(e) => setSeoSettings({...seoSettings, googleAnalytics: e.target.value})}
                    placeholder="UA-XXXXX-Y"
                  />
                </div>

                <div className="form-group">
                  <label>Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={seoSettings.facebookPixel}
                    onChange={(e) => setSeoSettings({...seoSettings, facebookPixel: e.target.value})}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3>Crawl & Index</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={seoSettings.allowIndexing}
                    onChange={(e) => setSeoSettings({...seoSettings, allowIndexing: e.target.checked})}
                  />
                  <span className="toggle-text">Cho phép công cụ tìm kiếm index</span>
                </label>

                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={seoSettings.sitemapEnabled}
                    onChange={(e) => setSeoSettings({...seoSettings, sitemapEnabled: e.target.checked})}
                  />
                  <span className="toggle-text">Tự động tạo sitemap</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopSettings;