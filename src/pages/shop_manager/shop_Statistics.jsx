// src/pages/shop/ShopStatistics.jsx
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
import shopApi from '../../api/api';
import '../../css/ShopStatistics.css';

// Đăng ký ChartJS
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
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [stats, setStats] = useState({
    totalCustomers: 15000,
    totalOrders: 1000,
    totalRevenue: 10000000,
    totalReturns: 10,
    averageRating: 4.9,
    totalReviews: 100,
    reviewStats: {
      good: 75,
      normal: 15,
      bad: 10
    }
  });

  const [revenueData, setRevenueData] = useState({
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    datasets: [
      {
        label: 'Doanh thu 2024',
        data: [25000000, 20000000, 18000000, 22000000, 28000000, 30000000, 32000000, 29000000, 31000000, 35000000, 38000000, 42000000],
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
      },
      {
        label: 'Doanh thu 2023',
        data: [20000000, 18000000, 15000000, 19000000, 22000000, 25000000, 27000000, 24000000, 26000000, 30000000, 32000000, 35000000],
        borderColor: '#ff9f40',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#ff9f40',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        hidden: true
      }
    ]
  });

  const [orderData, setOrderData] = useState({
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: [45, 52, 48, 70, 85, 92, 78],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderRadius: 6
      }
    ]
  });

  const [feedbackData, setFeedbackData] = useState({
    labels: ['Tốt', 'Bình thường', 'Xấu'],
    datasets: [
      {
        data: [stats.reviewStats.good, stats.reviewStats.normal, stats.reviewStats.bad],
        backgroundColor: [
          'rgba(40, 167, 69, 0.9)',
          'rgba(255, 193, 7, 0.9)',
          'rgba(220, 53, 69, 0.9)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  });

  // Fetch data từ API
  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Gọi API thống kê tổng quan
      const overviewResponse = await shopApi.get('/api/v1/shop/statistics/overview');
      setStats(prev => ({ ...prev, ...overviewResponse.data }));

      // Gọi API doanh thu theo thời gian
      const revenueResponse = await shopApi.get('/api/v1/shop/statistics/revenue', {
        params: { range: timeRange }
      });
      
      // Cập nhật dữ liệu biểu đồ
      updateChartData(revenueResponse.data);
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Sử dụng dữ liệu mẫu nếu API lỗi
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (data) => {
    // Cập nhật dữ liệu biểu đồ theo response từ API
    if (data) {
      // Xử lý cập nhật dữ liệu
    }
  };

  // Format functions
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'tr';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          callback: function(value) {
            return formatCompactNumber(value);
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: function(context) {
            return `Số đơn: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}% (${context.raw} lượt)`;
          }
        }
      }
    },
    cutout: '60%',
    layout: {
      padding: {
        top: 10,
        bottom: 10
      }
    }
  };

  const handleExportReport = () => {
    // Xử lý xuất báo cáo
    alert('Đang xuất báo cáo...');
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
      {/* Header */}
      <div className="statistics-header">
        <h1 className="statistics-title">Bảng Điều Khiển</h1>
        <div className="header-actions">
          <div className="time-range-selector">
            <button 
              className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Tuần
            </button>
            <button 
              className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Tháng
            </button>
            <button 
              className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Năm
            </button>
          </div>
          <button className="export-btn" onClick={handleExportReport}>
            <FaDownload /> Tải báo cáo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaUsers />
          </div>
          <div className="stat-content">
            <span className="stat-label">Số lượng khách</span>
            <span className="stat-value">{formatNumber(stats.totalCustomers)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FaShoppingBag />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng đơn hàng</span>
            <span className="stat-value">{formatNumber(stats.totalOrders)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng doanh thu</span>
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FaExchangeAlt />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đối Trả hàng</span>
            <span className="stat-value">{formatNumber(stats.totalReturns)}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Line Chart - Revenue */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Doanh thu theo tháng</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color current"></span>
                2024
              </span>
              <span className="legend-item">
                <span className="legend-color previous"></span>
                2023
              </span>
            </div>
          </div>
          <div className="chart-body">
            <Line data={revenueData} options={lineOptions} />
          </div>
        </div>

        {/* Bar Chart - Orders */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Số lượng đơn hàng theo ngày</h3>
            <FaCalendarAlt className="chart-icon" />
          </div>
          <div className="chart-body">
            <Bar data={orderData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Feedback Chart */}
        <div className="feedback-card">
          <div className="feedback-header">
            <h3>Phản hồi của khách hàng</h3>
            <div className="rating-summary">
              <div className="average-rating">
                <FaStar className="star-icon" />
                <span className="rating-value">{stats.averageRating}</span>
                <span className="rating-max">/5</span>
              </div>
              <div className="total-reviews">
                <FaComment className="comment-icon" />
                <span>{formatNumber(stats.totalReviews)} lượt</span>
              </div>
            </div>
          </div>

          <div className="feedback-content">
            <div className="chart-container">
              <Doughnut data={feedbackData} options={doughnutOptions} />
            </div>

            <div className="feedback-stats">
              <div className="feedback-item good">
                <div className="feedback-label">
                  <FaThumbsUp className="feedback-icon" />
                  <span>Tốt</span>
                </div>
                <div className="feedback-bar">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${stats.reviewStats.good}%` }}
                  ></div>
                </div>
                <span className="feedback-percent">{stats.reviewStats.good}%</span>
              </div>

              <div className="feedback-item normal">
                <div className="feedback-label">
                  <FaMeh className="feedback-icon" />
                  <span>Bình thường</span>
                </div>
                <div className="feedback-bar">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${stats.reviewStats.normal}%` }}
                  ></div>
                </div>
                <span className="feedback-percent">{stats.reviewStats.normal}%</span>
              </div>

              <div className="feedback-item bad">
                <div className="feedback-label">
                  <FaFrown className="feedback-icon" />
                  <span>Xấu</span>
                </div>
                <div className="feedback-bar">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${stats.reviewStats.bad}%` }}
                  ></div>
                </div>
                <span className="feedback-percent">{stats.reviewStats.bad}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Comments */}
        <div className="recent-comments-card">
          <div className="comments-header">
            <h3>Bình luận gần đây</h3>
            <button className="view-all">Xem tất cả</button>
          </div>

          <div className="comments-list">
            <div className="comment-item">
              <div className="comment-avatar">
                <img src="https://ui-avatars.com/api/?name=Nguyễn+Văn+A&background=2e7d32&color=fff&size=40" alt="Avatar" />
              </div>
              <div className="comment-content">
                <div className="comment-user">
                  <span className="user-name">Nguyễn Văn A</span>
                  <div className="comment-rating">
                    {[1,2,3,4,5].map(star => (
                      <FaStar key={star} className="star-filled" />
                    ))}
                  </div>
                </div>
                <p className="comment-text">Sản phẩm chất lượng tốt, đóng gói cẩn thận. Giao hàng nhanh.</p>
                <span className="comment-time">2 giờ trước</span>
              </div>
            </div>

            <div className="comment-item">
              <div className="comment-avatar">
                <img src="https://ui-avatars.com/api/?name=Trần+Thị+B&background=2e7d32&color=fff&size=40" alt="Avatar" />
              </div>
              <div className="comment-content">
                <div className="comment-user">
                  <span className="user-name">Trần Thị B</span>
                  <div className="comment-rating">
                    {[1,2,3,4].map(star => (
                      <FaStar key={star} className="star-filled" />
                    ))}
                    <FaStar className="star-empty" />
                  </div>
                </div>
                <p className="comment-text">Hàng đẹp, sẽ ủng hộ shop lần sau.</p>
                <span className="comment-time">5 giờ trước</span>
              </div>
            </div>

            <div className="comment-item">
              <div className="comment-avatar">
                <img src="https://ui-avatars.com/api/?name=Lê+Văn+C&background=2e7d32&color=fff&size=40" alt="Avatar" />
              </div>
              <div className="comment-content">
                <div className="comment-user">
                  <span className="user-name">Lê Văn C</span>
                  <div className="comment-rating">
                    {[1,2,3].map(star => (
                      <FaStar key={star} className="star-filled" />
                    ))}
                    {[1,2].map(star => (
                      <FaStar key={star} className="star-empty" />
                    ))}
                  </div>
                </div>
                <p className="comment-text">Sản phẩm ổn, giá cả hợp lý.</p>
                <span className="comment-time">1 ngày trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopStatistics;