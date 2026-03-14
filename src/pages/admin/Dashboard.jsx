import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, FileText, AlertOctagon, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/api';

// Dữ liệu mẫu cho biểu đồ đường
const visitData = [
  { name: 'T1', value: 2000000 },
  { name: 'T2', value: 4000000 },
  { name: 'T3', value: 3000000 },
  { name: 'T4', value: 6000000 },
  { name: 'T5', value: 5500000 },
  { name: 'T6', value: 8000000 },
  { name: 'T7', value: 15000000 },
];

// Dữ liệu mẫu cho biểu đồ tròn
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('admin_token'); // Dùng key riêng cho admin
        if (!token) {
          setError('Vui lòng đăng nhập lại');
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 2000);
          return;
        }

        const [dashboardRes, categoryRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/post-category')
        ]);

        if (dashboardRes?.data) {
          setStats({
            users: dashboardRes.data.total_users || 0,
            shops: dashboardRes.data.total_shops || 0,
            posts: dashboardRes.data.total_posts || 0,
            reports: dashboardRes.data.total_reports || 0
          });
        }

        if (categoryRes?.data && Array.isArray(categoryRes.data)) {
          const converted = categoryRes.data.map((item, index) => ({
            name: item.category || `Danh mục ${index + 1}`,
            value: item.percentage || 0,
            count: item.count || 0,
            color: getColorForKey(item.category, index)
          }));
          setPostStats(converted);
        }
        
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setTimeout(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/admin/login';
          }, 2000);
        } else {
          setError('Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getColorForKey = (key, index) => {
    const colors = {
      'Nông Sản': '#4ade80',
      'Hải Sản': '#3b82f6', 
      'Đặc Sản': '#f59e0b',
      'default': '#8884d8'
    };
    
    if (colors[key]) return colors[key];
    
    const colorPalette = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colorPalette[index % colorPalette.length];
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('vi-VN');
  };

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div>
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          color: '#991b1b',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
        {renderDashboardContent()}
      </div>
    );
  }

  function renderDashboardContent() {
    return (
      <div>
        <h2 className="dashboard-title">Bảng Điều Khiển</h2>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard 
            icon={<Users size={24} className="text-green-600"/>} 
            label="Người Dùng" 
            value={formatNumber(stats.users)} 
            iconClass="green" 
          />
          <StatCard 
            icon={<ShoppingBag size={24} className="text-orange-600"/>} 
            label="Cửa Hàng" 
            value={formatNumber(stats.shops)} 
            iconClass="orange" 
          />
          <StatCard 
            icon={<FileText size={24} className="text-blue-600"/>} 
            label="Bài Viết" 
            value={formatNumber(stats.posts)} 
            iconClass="blue" 
          />
          <StatCard 
            icon={<AlertOctagon size={24} className="text-red-600"/>} 
            label="Báo Cáo" 
            value={formatNumber(stats.reports)} 
            iconClass="red" 
          />
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Biểu đồ lượt truy cập */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Lượt Truy Cập</h3>
              <button className="download-btn">
                <Download size={14} /> Tải báo cáo
              </button>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#9ca3af'}}
                    tickFormatter={(value) => `${(value/1000000)}M`}
                  />
                  <Tooltip 
                    formatter={(value) => `${(value/1000000).toFixed(1)}M`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#16a34a" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#16a34a' }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ tròn */}
          <div className="chart-card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              Thống Kê Bài Viết
            </h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={postStats}
                    innerRadius={50} 
                    outerRadius={70} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {postStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="pie-legend">
              {postStats.map((item) => (
                <div key={item.name} className="legend-item">
                  <div className="legend-label">
                    <div 
                      className="legend-color" 
                      style={{backgroundColor: item.color}}
                    ></div>
                    <span>{item.name}</span>
                  </div>
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
            <div className="empty-state">Chưa có hoạt động mới</div>
          </div>
          <div className="bottom-card">
            <h3>Cửa Hàng Mới</h3>
            <div className="empty-state">Đang cập nhật danh sách...</div>
          </div>
        </div>
      </div>
    );
  }

  return renderDashboardContent();
};

const StatCard = ({ icon, label, value, iconClass }) => (
  <div className="stat-card">
    <div className={`stat-icon ${iconClass}`}>
      {icon}
    </div>
    <div className="stat-info">
      <h4>{label}</h4>
      <p>{value}</p>
    </div>
  </div>
);

export default Dashboard;