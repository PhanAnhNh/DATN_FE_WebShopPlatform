import React, { useState, useEffect } from 'react';
import { FaSave, FaSpinner, FaSun, FaMoon, FaGlobe, FaCalendarAlt } from 'react-icons/fa';
import { adminApi } from '../../api/api';
import '../../css/AdminSettings.css';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    language: 'vi',
    date_format: 'dd/mm/yyyy',
    time_format: '24h',
    theme: 'light',
    timezone: 'Asia/Ho_Chi_Minh'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. ÁP DỤNG NGAY THEME TỪ LOCAL STORAGE ĐỂ KHÔNG BỊ CHỚP SÁNG
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      setSettings(prev => ({ ...prev, theme: savedTheme }));
    }
    
    // 2. Sau đó mới gọi API để lấy data mới nhất
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/api/v1/admin/settings');
      setSettings(res.data);
      
      // Đồng bộ lại phòng trường hợp DB khác Local Storage
      document.documentElement.setAttribute('data-theme', res.data.theme);
      localStorage.setItem('admin_theme', res.data.theme);
    } catch (err) {
      console.error(err);
      setError('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await adminApi.put('/api/v1/admin/settings', settings);
      setSuccess('Cập nhật thành công!');
      
      localStorage.setItem('admin_theme', settings.theme);
      document.documentElement.setAttribute('data-theme', settings.theme);
      window.dispatchEvent(new CustomEvent('themeChange', { detail: settings.theme }));
      
      // Tự động tắt thông báo sau 3 giây
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings loading">
        <FaSpinner className="spinning" />
        <p>Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="settings-containers">
        
        <header className="settings-header">
          <h1>Cài đặt hệ thống</h1>
          <p>Quản lý cấu hình hiển thị, ngôn ngữ và thời gian trên toàn hệ thống.</p>
        </header>

        {success && <div className="alert success">{success}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          
          {/* Section 1: Localization */}
          <section className="settings-section">
            <h2 className="section-title"><FaGlobe /> Định dạng chung</h2>
            <div className="theme-grid">
              <div className="form-group">
                <label>Ngôn ngữ hệ thống</label>
                <select name="language" value={settings.language} onChange={handleChange}>
                  <option value="vi">Tiếng Việt (Vietnam)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Múi giờ (Timezone)</label>
                <select name="timezone" value={settings.timezone} onChange={handleChange}>
                  <option value="Asia/Ho_Chi_Minh">Hanoi, Vietnam (GMT+7)</option>
                  <option value="Asia/Singapore">Singapore (GMT+8)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Date & Time */}
          <section className="settings-section">
            <h2 className="section-title"><FaCalendarAlt /> Thời gian & Ngày tháng</h2>
            <div className="theme-grid">
              <div className="form-group">
                <label>Định dạng ngày</label>
                <select name="date_format" value={settings.date_format} onChange={handleChange}>
                  <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Định dạng giờ</label>
                <select name="time_format" value={settings.time_format} onChange={handleChange}>
                  <option value="24h">24 giờ (14:30)</option>
                  <option value="12h">12 giờ (02:30 PM)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: Appearance */}
          <section className="settings-section">
            <h2 className="section-title"><FaSun /> Giao diện hiển thị</h2>
            <div className="form-group">
              <label style={{ marginBottom: '16px' }}>Chọn chế độ nền</label>
              <div className="theme-grid">
                <div 
                  className={`theme-card ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                >
                  <FaSun />
                  <span>Chế độ Sáng</span>
                </div>
                <div 
                  className={`theme-card ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                >
                  <FaMoon />
                  <span>Chế độ Tối</span>
                </div>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? <FaSpinner className="spinning" /> : <FaSave />}
              {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;