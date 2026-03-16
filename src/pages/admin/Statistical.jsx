// src/pages/admin/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Store, FileText, Flag, TrendingUp, 
  Star, MessageCircle, ThumbsUp, Share2,
  ChevronLeft, ChevronRight, Download,
  AlertCircle, CheckCircle, Clock, Eye
} from 'lucide-react';
import api from '../../api/api';
import '../../css/AdminManageLayout.css';
import Toast from '../../components/Toast';

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Toast states
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Dữ liệu thống kê tổng quan
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 15000,
    totalShops: 1000,
    totalPosts: 5000,
    totalReports: 500,
    userGrowth: 12.5,
    shopGrowth: 8.3,
    postGrowth: 15.2,
    reportGrowth: -5.1
  });

  // Dữ liệu thống kê bài viết
  const [postStats, setPostStats] = useState({
    totalViews: 125000,
    totalLikes: 45000,
    totalComments: 23000,
    totalShares: 8900,
    postsByType: [
      { type: 'Bài viết thường', count: 3200, color: '#1976d2' },
      { type: 'Sản phẩm', count: 850, color: '#2e7d32' },
      { type: 'Đánh giá', count: 650, color: '#ed6c02' },
      { type: 'Chia sẻ', count: 300, color: '#9c27b0' }
    ],
    postsByCategory: [
      { category: 'Nông sản', count: 1800, color: '#1976d2' },
      { category: 'Hải sản', count: 1500, color: '#2e7d32' },
      { category: 'Đặc sản', count: 1200, color: '#ed6c02' },
      { category: 'Khác', count: 500, color: '#9c27b0' }
    ]
  });

  // Dữ liệu thống kê cửa hàng
  const [shopStats, setShopStats] = useState({
    activeShops: 850,
    inactiveShops: 120,
    bannedShops: 30,
    verifiedShops: 620,
    shopsByCategory: [
      { category: 'Nông sản', count: 380, revenue: 125000000 },
      { category: 'Hải sản', count: 320, revenue: 98000000 },
      { category: 'Đặc sản', count: 200, revenue: 75000000 },
      { category: 'Tổng hợp', count: 100, revenue: 45000000 }
    ]
  });

  // Cửa hàng tích cực nhất
  const [topShops, setTopShops] = useState([
    { 
      id: 1, 
      name: 'Nông sản sạch ABC', 
      avatar: null,
      posts: 156, 
      products: 89, 
      revenue: 45600000,
      followers: 1234,
      rating: 4.8
    },
    { 
      id: 2, 
      name: 'Hải sản tươi sống XYZ', 
      avatar: null,
      posts: 142, 
      products: 76, 
      revenue: 38900000,
      followers: 987,
      rating: 4.7
    },
    { 
      id: 3, 
      name: 'Đặc sản vùng miền', 
      avatar: null,
      posts: 128, 
      products: 64, 
      revenue: 32400000,
      followers: 856,
      rating: 4.9
    },
    { 
      id: 4, 
      name: 'Nông trại xanh', 
      avatar: null,
      posts: 112, 
      products: 53, 
      revenue: 28700000,
      followers: 743,
      rating: 4.6
    },
    { 
      id: 5, 
      name: 'Thủy hải sản Miền Tây', 
      avatar: null,
      posts: 98, 
      products: 47, 
      revenue: 25600000,
      followers: 621,
      rating: 4.5
    }
  ]);

  // Thống kê bình luận theo đánh giá
  const [commentStats, setCommentStats] = useState([
    { label: 'Tốt', value: 65, color: '#4caf50', icon: '😊' },
    { label: 'Bình thường', value: 20, color: '#ff9800', icon: '😐' },
    { label: 'Spam', value: 8, color: '#f44336', icon: '⚠️' },
    { label: 'Xấu', value: 7, color: '#9e9e9e', icon: '👎' }
  ]);

  // Thống kê theo thời gian
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gọi API lấy dữ liệu thống kê
      // const response = await api.get(`/admin/statistics?range=${timeRange}`);
      // setOverviewStats(response.data.overview);
      // setPostStats(response.data.posts);
      // setShopStats(response.data.shops);
      // setTopShops(response.data.topShops);
      // setCommentStats(response.data.comments);
      
      // Giả lập loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Không thể tải dữ liệu thống kê');
      showToast('Không thể tải dữ liệu thống kê', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ icon: Icon, title, value, growth, color, bgColor }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flex: 1
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        background: bgColor || `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        <Icon size={30} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{value}</div>
        {growth !== undefined && (
          <div style={{
            fontSize: '13px',
            color: growth >= 0 ? '#4caf50' : '#f44336',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            marginTop: '5px'
          }}>
            <TrendingUp size={14} style={{ transform: growth >= 0 ? 'none' : 'rotate(180deg)' }} />
            <span>{Math.abs(growth)}% so với tháng trước</span>
          </div>
        )}
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, color, icon, showPercent = true }) => (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
        <span style={{ color: '#555' }}>
          {icon && <span style={{ marginRight: '5px' }}>{icon}</span>}
          {label}
        </span>
        {showPercent && <span style={{ fontWeight: 'bold', color: color }}>{value}%</span>}
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );

  const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    let cumulativePercent = 0;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {data.map((item, index) => {
              const percent = (item.count / total) * 100;
              const startAngle = (cumulativePercent * 360) / 100;
              cumulativePercent += percent;
              const endAngle = (cumulativePercent * 360) / 100;
              
              const x1 = 60 + 50 * Math.cos((startAngle * Math.PI) / 180 - Math.PI / 2);
              const y1 = 60 + 50 * Math.sin((startAngle * Math.PI) / 180 - Math.PI / 2);
              const x2 = 60 + 50 * Math.cos((endAngle * Math.PI) / 180 - Math.PI / 2);
              const y2 = 60 + 50 * Math.sin((endAngle * Math.PI) / 180 - Math.PI / 2);
              
              const largeArcFlag = percent > 50 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  opacity="0.8"
                />
              );
            })}
            <circle cx="60" cy="60" r="30" fill="white" />
          </svg>
        </div>
        <div>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
              <span style={{ fontSize: '13px', color: '#555' }}>{item.type || item.category}</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', marginLeft: 'auto' }}>
                {Math.round((item.count / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="users-management">
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">Thống Kê</h2>
        
        {/* Time range selector */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">12 tháng qua</option>
          </select>
          
          <button 
            className="btn btn-success"
            onClick={() => {/* Export report */}}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={16} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Overview Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard 
              icon={Users}
              title="Người Dùng"
              value={formatNumber(overviewStats.totalUsers)}
              growth={overviewStats.userGrowth}
              color="#1976d2"
              bgColor="#e3f2fd"
            />
            <StatCard 
              icon={Store}
              title="Cửa Hàng"
              value={formatNumber(overviewStats.totalShops)}
              growth={overviewStats.shopGrowth}
              color="#2e7d32"
              bgColor="#e8f5e9"
            />
            <StatCard 
              icon={FileText}
              title="Bài Viết"
              value={formatNumber(overviewStats.totalPosts)}
              growth={overviewStats.postGrowth}
              color="#ed6c02"
              bgColor="#fff3e0"
            />
            <StatCard 
              icon={Flag}
              title="Báo Cáo"
              value={formatNumber(overviewStats.totalReports)}
              growth={overviewStats.reportGrowth}
              color="#d32f2f"
              bgColor="#ffebee"
            />
          </div>

          {/* Charts Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Thống kê bài viết */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>Thống Kê Bài Viết</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <DonutChart data={postStats.postsByType} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Tổng lượt xem</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{formatNumber(postStats.totalViews)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Tổng lượt thích</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{formatNumber(postStats.totalLikes)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Tổng bình luận</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{formatNumber(postStats.totalComments)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Tổng chia sẻ</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{formatNumber(postStats.totalShares)}</div>
                </div>
              </div>
            </div>

            {/* Thống kê cửa hàng */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>Thống Kê Cửa Hàng</h3>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Đang hoạt động</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{shopStats.activeShops}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Tạm ngưng</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ed6c02' }}>{shopStats.inactiveShops}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Đã khóa</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>{shopStats.bannedShops}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Phân bố theo danh mục</div>
                {shopStats.shopsByCategory.map((item, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                      <span>{item.category}</span>
                      <span style={{ fontWeight: 'bold' }}>{item.count} cửa hàng</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: '#f0f0f0',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(item.count / shopStats.activeShops) * 100}%`,
                        height: '100%',
                        background: index === 0 ? '#1976d2' : index === 1 ? '#2e7d32' : index === 2 ? '#ed6c02' : '#9c27b0',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Những cửa hàng tích cực */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>Những Cửa Hàng Tích Cực</h3>
            
            <table className="data-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Thứ tự</th>
                  <th>Tên cửa hàng</th>
                  <th>Bài viết</th>
                  <th>Sản phẩm</th>
                  <th>Doanh thu</th>
                  <th>Người theo dõi</th>
                  <th>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {topShops.map((shop, index) => (
                  <tr key={shop.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {shop.avatar ? (
                          <img src={shop.avatar} alt={shop.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#1976d2',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {shop.name.charAt(0)}
                          </div>
                        )}
                        <span>{shop.name}</span>
                      </div>
                    </td>
                    <td>{shop.posts}</td>
                    <td>{shop.products}</td>
                    <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>{formatCurrency(shop.revenue)}</td>
                    <td>{formatNumber(shop.followers)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Star size={14} color="#ffc107" fill="#ffc107" />
                        <span>{shop.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bình luận bài viết */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>Bình Luận Bài Viết</h3>
            
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {commentStats.map((item, index) => (
                  <ProgressBar 
                    key={index}
                    label={item.label}
                    value={item.value}
                    color={item.color}
                    icon={item.icon}
                  />
                ))}
              </div>
              
              <div style={{ width: '200px', textAlign: 'center' }}>
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    ${commentStats.map(item => `${item.color} ${item.value}%`).join(', ')}
                  )`,
                  margin: '0 auto 15px'
                }} />
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Tổng số: <strong>{formatNumber(23000)}</strong> bình luận
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;