import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, FileText, AlertOctagon, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../../api/api';

const defaultPostStats = [
  { name: 'Nông Sản', value: 45, color: '#4ade80' },
  { name: 'Hải Sản', value: 34, color: '#3b82f6' },
  { name: 'Đặc Sản', value: 21, color: '#f59e0b' },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    shops: 0,
    posts: 0,
    reports: 0
  });
  const [postStats, setPostStats] = useState(defaultPostStats);
  const [recentActivities, setRecentActivities] = useState([]);
  const [newShops, setNewShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitData, setVisitData] = useState([]);


  // Đồng bộ theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('admin_token');
        if (!token) {
          setError('Vui lòng đăng nhập lại');
          setTimeout(() => window.location.href = '/admin/login', 2000);
          return;
        }
        const interactionRes = await adminApi.get('/api/v1/admin/interaction-stats?days=7');
          if (interactionRes?.data && Array.isArray(interactionRes.data)) {
              setVisitData(interactionRes.data.map(item => ({
                  name: item.date,
                  value: item.interactions
              })));
          }

        // 1. Dashboard stats
        try {
          const dashboardRes = await adminApi.get('/api/v1/admin/dashboard');
          if (dashboardRes?.data) {
            setStats({
              users: dashboardRes.data.total_users || 0,
              shops: dashboardRes.data.total_shops || 0,
              posts: dashboardRes.data.total_posts || 0,
              reports: dashboardRes.data.total_reports || 0
            });
          }
        } catch (err) {
          console.error('Dashboard API error:', err);
        }

        // 2. Post category stats
        try {
          const categoryRes = await adminApi.get('/api/v1/admin/post-category');
          if (categoryRes?.data && Array.isArray(categoryRes.data)) {
            const converted = categoryRes.data.map((item, index) => ({
                name: item.category || `Danh mục ${index + 1}`,
                value: item.percentage || 0,
                count: item.count || 0,
                color: getFixedColor(item.category)  // dùng màu cố định
              }));
            setPostStats(converted);
          }
        } catch (err) {
          console.error('Category API error:', err);
        }

        // 3. New users -> recent activities
        try {
          const newUsersRes = await adminApi.get('/api/v1/admin/new-users');
          if (newUsersRes?.data && Array.isArray(newUsersRes.data)) {
            const activities = newUsersRes.data.slice(0, 5).map(user => ({
              id: user._id,
              type: 'user',
              title: 'Người dùng mới',
              description: `${user.full_name || user.username} vừa đăng ký`,
              time: new Date(user.created_at).toLocaleString('vi-VN'),
              avatar: user.avatar_url
            }));
            setRecentActivities(activities);
          }
        } catch (err) {
          console.error('New users API error:', err);
        }

        // 4. New shops
        try {
          const newShopsRes = await adminApi.get('/api/v1/admin/new-shops');
          if (newShopsRes?.data && Array.isArray(newShopsRes.data)) {
            setNewShops(newShopsRes.data.slice(0, 5));
          }
        } catch (err) {
          console.error('New shops API error:', err);
          // Fallback dữ liệu mẫu
          setNewShops([
            { _id: '1', name: 'Đặc sản quê', owner_name: 'Nguyễn Văn B', created_at: new Date() },
            { _id: '2', name: 'Hải sản tươi sống', owner_name: 'Trần Thị C', created_at: new Date() },
          ]);
        }

        try {
            const visitRes = await adminApi.get('/api/v1/admin/visit-stats?days=7');
            if (visitRes?.data && Array.isArray(visitRes.data)) {
                setVisitData(visitRes.data);
            }
        } catch (err) {
            console.error('Visit stats API error:', err);
        }

      } catch (err) {
        console.error('Lỗi chung:', err);
        setError('Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFixedColor = (category) => {
    const colorMap = {
      'Nông Sản': '#4ade80',   // xanh lá
      'Hải Sản': '#3b82f6',    // xanh dương
      'Đặc Sản': '#f59e0b',    // cam
      'Chung': '#8884d8',       // tím
      'agriculture': '#4ade80',
      'seafood': '#3b82f6',
      'specialty': '#f59e0b',
      'general': '#8884d8'
    };
    return colorMap[category] || '#8884d8';
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('vi-VN');
  };

  return (
    <div>
      <h2 className="dashboard-title">Bảng Điều Khiển</h2>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#991b1b', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={<Users size={24} />} label="Người Dùng" value={formatNumber(stats.users)} iconClass="green" />
        <StatCard icon={<ShoppingBag size={24} />} label="Cửa Hàng" value={formatNumber(stats.shops)} iconClass="orange" />
        <StatCard icon={<FileText size={24} />} label="Bài Viết" value={formatNumber(stats.posts)} iconClass="blue" />
        <StatCard icon={<AlertOctagon size={24} />} label="Báo Cáo" value={formatNumber(stats.reports)} iconClass="red" />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Biểu đồ đường */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Lượt Truy Cập (Demo)</h3>
            <button className="download-btn"><Download size={14} /> Tải báo cáo</button>
          </div>
          <div className="chart-container" style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tickFormatter={(v) => `${v/1000000}M`} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip formatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ tròn */}
        <div className="chart-card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Thống Kê Bài Viết</h3>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={postStats} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value"
                  label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {postStats.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-legend">
            {postStats.map((item) => (
              <div key={item.name} className="legend-item">
                <div className="legend-label"><div className="legend-color" style={{backgroundColor: item.color}}></div><span>{item.name}</span></div>
                <span className="legend-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        <div className="bottom-card">
          <h3>Hoạt Động Gần Đây</h3>
          {recentActivities.length === 0 ? (
            <div className="empty-state">Chưa có hoạt động mới</div>
          ) : (
            <div className="activity-list">
              {recentActivities.map(act => (
                <div key={act.id} className="activity-item">
                  <div className="activity-icon">{act.type === 'user' ? '👤' : '🏪'}</div>
                  <div className="activity-content">
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-desc">{act.description}</div>
                    <div className="activity-time">{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bottom-card">
          <h3>Cửa Hàng Mới</h3>
          {newShops.length === 0 ? (
            <div className="empty-state">Đang cập nhật danh sách...</div>
          ) : (
            <div className="shop-list">
              {newShops.map(shop => (
                <div key={shop._id} className="shop-item">
                  <div className="shop-name">{shop.name}</div>
                  <div className="shop-owner">{shop.owner_name || 'Chủ shop'}</div>
                  <div className="shop-time">{new Date(shop.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .activity-list, .shop-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-item, .shop-item {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid var(--admin-border);
        }
        .activity-icon {
          width: 32px;
          height: 32px;
          background: var(--admin-primary-soft);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .activity-content {
          flex: 1;
        }
        .activity-title {
          font-weight: 600;
          color: var(--admin-text-primary);
        }
        .activity-desc {
          font-size: 13px;
          color: var(--admin-text-secondary);
        }
        .activity-time {
          font-size: 11px;
          color: var(--admin-text-secondary);
        }
        .shop-name {
          font-weight: 600;
          color: var(--admin-text-primary);
        }
        .shop-owner {
          font-size: 13px;
          color: var(--admin-text-secondary);
        }
        .shop-time {
          font-size: 11px;
          color: var(--admin-text-secondary);
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ icon, label, value, iconClass }) => (
  <div className="stat-card">
    <div className={`stat-icon ${iconClass}`}>{icon}</div>
    <div className="stat-info">
      <h4>{label}</h4>
      <p>{value}</p>
    </div>
  </div>
);

export default Dashboard;