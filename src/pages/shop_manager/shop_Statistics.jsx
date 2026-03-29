import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaShoppingBag, 
  FaMoneyBillWave, 
  FaExchangeAlt,
  FaDownload,
  FaStar,
  FaComment,
  FaThumbsUp,
  FaMeh,
  FaFrown,
  FaCalendarAlt,
  FaChartLine,
  FaSpinner
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { shopApi } from '../../api/api';
import '../../css/ShopStatistics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const ShopStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalReturns: 0,
    averageRating: 0,
    totalReviews: 0,
    reviewStats: { good: 0, normal: 0, bad: 0 }
  });

  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [{
      label: 'Doanh thu',
      data: [],
      borderColor: '#4bc0c0',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#4bc0c0',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true
    }]
  });

  const [orderData, setOrderData] = useState({
    labels: [],
    datasets: [{
      label: 'Số lượng đơn hàng',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderRadius: 6
    }]
  });

  const [feedbackData, setFeedbackData] = useState({
    labels: ['Tốt (4-5 sao)', 'Bình thường (3 sao)', 'Xấu (1-2 sao)'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['rgba(40, 167, 69, 0.9)', 'rgba(255, 193, 7, 0.9)', 'rgba(220, 53, 69, 0.9)'],
      borderColor: ['rgba(40, 167, 69, 1)', 'rgba(255, 193, 7, 1)', 'rgba(220, 53, 69, 1)'],
      borderWidth: 2,
      hoverOffset: 8
    }]
  });

  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // 1. Thống kê tổng quan
      const overviewRes = await shopApi.get('/api/v1/shop/statistics/overview');
      setStats(prev => ({ ...prev, ...overviewRes.data }));

      // 2. Thống kê đánh giá
      const reviewsRes = await shopApi.get('/api/v1/shop/statistics/reviews');
      if (reviewsRes.data) {
        setStats(prev => ({ 
          ...prev, 
          averageRating: reviewsRes.data.averageRating,
          totalReviews: reviewsRes.data.totalReviews,
          reviewStats: reviewsRes.data.reviewStats
        }));
        
        const total = reviewsRes.data.totalReviews;
        if (total > 0) {
          setFeedbackData({
            ...feedbackData,
            datasets: [{
              ...feedbackData.datasets[0],
              data: [
                reviewsRes.data.reviewStats.good,
                reviewsRes.data.reviewStats.normal,
                reviewsRes.data.reviewStats.bad
              ]
            }]
          });
        }
      }

      // 3. Doanh thu theo thời gian
      const revenueRes = await shopApi.get('/api/v1/shop/statistics/revenue', {
        params: { range: timeRange }
      });
      updateRevenueChart(revenueRes.data);

      // 4. Đơn hàng theo ngày
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const ordersRes = await shopApi.get('/api/v1/shop/statistics/orders/daily', {
        params: { days }
      });
      updateOrdersChart(ordersRes.data, timeRange);

      // 5. Bình luận gần đây
      const recentRes = await shopApi.get('/api/v1/shop/statistics/recent-reviews', {
        params: { limit: 5 }
      });
      setRecentReviews(recentRes.data || []);

    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRevenueChart = (data) => {
    if (!data || data.length === 0) {
      setRevenueData({ ...revenueData, labels: [], datasets: [{ ...revenueData.datasets[0], data: [] }] });
      return;
    }
    
    const labels = data.map(item => {
      if (timeRange === 'week') {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return dayNames[item._id - 1] || `Ngày ${item._id}`;
      } else if (timeRange === 'month') {
        return `Ngày ${item._id}`;
      } else {
        return `Tháng ${item._id}`;
      }
    });
    
    setRevenueData({
      labels,
      datasets: [{ ...revenueData.datasets[0], data: data.map(item => item.revenue) }]
    });
  };

  const updateOrdersChart = (data, range) => {
    if (!data || data.length === 0) {
      setOrderData({ ...orderData, labels: [], datasets: [{ ...orderData.datasets[0], data: [] }] });
      return;
    }
    
    const labels = data.map(item => {
      if (range === 'week') {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const day = new Date(item._id.year, item._id.month - 1, item._id.day).getDay();
        return dayNames[day];
      } else if (range === 'month') {
        return `${item._id.day}/${item._id.month}`;
      } else {
        return `Tháng ${item._id.month}`;
      }
    });
    
    setOrderData({
      labels,
      datasets: [{ ...orderData.datasets[0], data: data.map(item => item.count) }]
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num || 0);
  };

  const formatCompactNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'tr';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 6 } },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: { label: (ctx) => `Doanh thu: ${formatCurrency(ctx.parsed.y)}` }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: (v) => formatCompactNumber(v) } },
      x: { grid: { display: false } }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `Số đơn: ${ctx.raw}` } } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx) => { const total = ctx.dataset.data.reduce((a,b)=>a+b,0); const pct = total>0 ? ((ctx.raw/total)*100).toFixed(1):0; return `${ctx.label}: ${pct}% (${ctx.raw} lượt)`; } } }
    },
    cutout: '60%'
  };

  const handleExportReport = async () => {
    try {
      const response = await shopApi.get('/api/v1/shop/statistics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao_cao_thong_ke_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Có lỗi xảy ra khi xuất báo cáo');
    }
  };

  if (loading) {
    return (
      <div className="shop-statistics loading">
        <FaSpinner className="spinning" />
        <p>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="shop-statistics">
      <div className="statistics-header">
        <h1 className="statistics-title">Bảng Điều Khiển</h1>
        <div className="header-actions">
          <div className="time-range-selector">
            <button className={`range-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>Tuần</button>
            <button className={`range-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>Tháng</button>
            <button className={`range-btn ${timeRange === 'year' ? 'active' : ''}`} onClick={() => setTimeRange('year')}>Năm</button>
          </div>
          <button className="export-btn" onClick={handleExportReport}><FaDownload /> Tải báo cáo</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon blue"><FaUsers /></div><div className="stat-content"><span className="stat-label">Số lượng khách</span><span className="stat-value">{formatNumber(stats.totalCustomers)}</span></div></div>
        <div className="stat-card"><div className="stat-icon green"><FaShoppingBag /></div><div className="stat-content"><span className="stat-label">Tổng đơn hàng</span><span className="stat-value">{formatNumber(stats.totalOrders)}</span></div></div>
        <div className="stat-card"><div className="stat-icon purple"><FaMoneyBillWave /></div><div className="stat-content"><span className="stat-label">Tổng doanh thu</span><span className="stat-value">{formatCurrency(stats.totalRevenue)}</span></div></div>
        <div className="stat-card"><div className="stat-icon orange"><FaExchangeAlt /></div><div className="stat-content"><span className="stat-label">Đối Trả hàng</span><span className="stat-value">{formatNumber(stats.totalReturns)}</span></div></div>
      </div>

      <div className="charts-section">
        <div className="chart-card"><div className="chart-header"><h3>Doanh thu theo {timeRange === 'week' ? 'ngày' : timeRange === 'month' ? 'ngày' : 'tháng'}</h3><FaChartLine className="chart-icon" /></div><div className="chart-body">{revenueData.labels.length > 0 ? <Line data={revenueData} options={lineOptions} /> : <div className="no-data">Chưa có dữ liệu</div>}</div></div>
        <div className="chart-card"><div className="chart-header"><h3>Số lượng đơn hàng theo {timeRange === 'week' ? 'ngày' : timeRange === 'month' ? 'ngày' : 'tháng'}</h3><FaCalendarAlt className="chart-icon" /></div><div className="chart-body">{orderData.labels.length > 0 ? <Bar data={orderData} options={barOptions} /> : <div className="no-data">Chưa có dữ liệu</div>}</div></div>
      </div>

      <div className="bottom-section">
        <div className="feedback-card">
          <div className="feedback-header">
            <h3>Phản hồi của khách hàng</h3>
            <div className="rating-summary">
              <div className="average-rating"><FaStar className="star-icon" /><span className="rating-value">{stats.averageRating.toFixed(1)}</span><span className="rating-max">/5</span></div>
              <div className="total-reviews"><FaComment className="comment-icon" /><span>{formatNumber(stats.totalReviews)} lượt</span></div>
            </div>
          </div>
          <div className="feedback-content">
            <div className="chart-container"><Doughnut data={feedbackData} options={doughnutOptions} /></div>
            <div className="feedback-stats">
              <div className="feedback-item good"><div className="feedback-label"><FaThumbsUp /><span>Tốt (4-5 sao)</span></div><div className="feedback-bar"><div className="bar-fill" style={{ width: stats.totalReviews > 0 ? `${(stats.reviewStats.good / stats.totalReviews) * 100}%` : '0%' }}></div></div><span className="feedback-percent">{stats.totalReviews > 0 ? ((stats.reviewStats.good / stats.totalReviews) * 100).toFixed(1) : 0}%</span></div>
              <div className="feedback-item normal"><div className="feedback-label"><FaMeh /><span>Bình thường (3 sao)</span></div><div className="feedback-bar"><div className="bar-fill" style={{ width: stats.totalReviews > 0 ? `${(stats.reviewStats.normal / stats.totalReviews) * 100}%` : '0%' }}></div></div><span className="feedback-percent">{stats.totalReviews > 0 ? ((stats.reviewStats.normal / stats.totalReviews) * 100).toFixed(1) : 0}%</span></div>
              <div className="feedback-item bad"><div className="feedback-label"><FaFrown /><span>Xấu (1-2 sao)</span></div><div className="feedback-bar"><div className="bar-fill" style={{ width: stats.totalReviews > 0 ? `${(stats.reviewStats.bad / stats.totalReviews) * 100}%` : '0%' }}></div></div><span className="feedback-percent">{stats.totalReviews > 0 ? ((stats.reviewStats.bad / stats.totalReviews) * 100).toFixed(1) : 0}%</span></div>
            </div>
          </div>
        </div>

        <div className="recent-comments-card">
          <div className="comments-header"><h3>Bình luận gần đây</h3><button className="view-all" onClick={() => window.location.href = '/shop/reviews'}>Xem tất cả</button></div>
          <div className="comments-list">
            {recentReviews.length > 0 ? recentReviews.map((review, idx) => (
              <div key={idx} className="comment-item">
                <div className="comment-avatar"><img src={review.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user_name)}&background=2e7d32&color=fff&size=40`} alt={review.user_name} /></div>
                <div className="comment-content">
                  <div className="comment-user"><span className="user-name">{review.user_name}</span><div className="comment-rating">{[...Array(5)].map((_, i) => <FaStar key={i} className={i < review.rating ? 'star-filled' : 'star-empty'} />)}</div></div>
                  <p className="comment-text">{review.comment || 'Không có nội dung'}</p>
                  <span className="comment-time">{formatDate(review.created_at)}</span>
                </div>
              </div>
            )) : <div className="no-comments"><FaComment className="no-comment-icon" /><p>Chưa có bình luận nào</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopStatistics;