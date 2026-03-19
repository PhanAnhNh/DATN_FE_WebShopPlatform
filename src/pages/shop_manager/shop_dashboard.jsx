import React, { useState, useEffect } from 'react';
import { 
  FaShoppingBag, 
  FaBox, 
  FaMoneyBillWave, 
  FaExchangeAlt,
  FaDownload
} from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import api from '../../api/api';
import '../../css/Dashboard.css';

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ShopDashboard = () => {
  const [stats, setStats] = useState({
    totalPurchases: 15000,
    totalProducts: 1000,
    totalRevenue: 10000000,
    totalReturns: 10
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Cleanup function để tránh memory leak
    return () => {
      setStats({});
      setRecentActivities([]);
      setNewProducts([]);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Thử gọi API, nếu lỗi thì dùng dữ liệu mẫu
      try {
        const [statsRes, activitiesRes, productsRes] = await Promise.all([
          api.get('/api/v1/shop/dashboard/stats'),
          api.get('/api/v1/shop/dashboard/recent-activities'),
          api.get('api/v1/products?limit=5&sort=newest')
        ]);

        setStats(statsRes.data);
        setRecentActivities(activitiesRes.data);
        setNewProducts(productsRes.data);
      } catch (apiError) {
        console.log('API chưa sẵn sàng, dùng dữ liệu mẫu');
        // Dữ liệu mẫu
        setRecentActivities([
          { type: 'order', description: 'Đơn hàng #DH001 đã được thanh toán', time: '5 phút trước' },
          { type: 'product', description: 'Sản phẩm mới "Cà phê đặc sản" được thêm', time: '1 giờ trước' },
          { type: 'return', description: 'Yêu cầu đổi trả #RT001 đã được xử lý', time: '2 giờ trước' },
          { type: 'order', description: 'Đơn hàng #DH002 đã được giao thành công', time: '3 giờ trước' },
          { type: 'product', description: 'Sản phẩm "Mật ong rừng" hết hàng', time: '5 giờ trước' }
        ]);
        
        setNewProducts([
          { id: 1, name: 'Cà phê đặc sản', price: 250000, stock: 50, image_url: null },
          { id: 2, name: 'Mật ong rừng', price: 180000, stock: 30, image_url: null },
          { id: 3, name: 'Gạo lứt đen', price: 120000, stock: 100, image_url: null },
          { id: 4, name: 'Nấm linh chi', price: 350000, stock: 25, image_url: null },
          { id: 5, name: 'Trà shan tuyết', price: 280000, stock: 40, image_url: null }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu cho biểu đồ lượt truy cập
  const trafficData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Lượt truy cập',
        data: [1200, 1900, 1500, 2100, 2400, 2800, 3100],
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
      }
    ]
  };

  // Dữ liệu cho biểu đồ tròn
  const categoryData = {
    labels: ['Nông Sản', 'Hải Sản', 'Đặc Sản'],
    datasets: [
      {
        data: [45, 34, 21],
        backgroundColor: [
          'rgba(54, 162, 235, 0.9)',
          'rgba(75, 192, 192, 0.9)',
          'rgba(255, 206, 86, 0.9)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8
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
            return value.toLocaleString('vi-VN');
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
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
            return `${context.label}: ${context.raw}%`;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Bảng Điều Khiển</h1>
        <div className="dashboard__date">
          {new Date().toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__icon blue">
            <FaShoppingBag />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatNumber(stats.totalPurchases)}</h3>
            <p className="stat-card__label">Lượt Mua</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon green">
            <FaBox />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatNumber(stats.totalProducts)}</h3>
            <p className="stat-card__label">Sản Phẩm</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon purple">
            <FaMoneyBillWave />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="stat-card__label">Thu Nhập</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon orange">
            <FaExchangeAlt />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatNumber(stats.totalReturns)}</h3>
            <p className="stat-card__label">Đổi Trả</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard__charts">
        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Lượt Truy Cập</h3>
            <button className="chart-card__export">
              <FaDownload /> Tải báo cáo
            </button>
          </div>
          <div className="chart-card__body">
            <Line data={trafficData} options={lineOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Lượt Mua Hàng</h3>
          </div>
          <div className="chart-card__body doughnut-container">
            <div className="doughnut-wrapper">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
            <div className="category-legend">
              <div className="category-item">
                <span>
                  <span className="category-dot blue"></span>
                  Nông Sản
                </span>
                <span className="category-percent">45%</span>
              </div>
              <div className="category-item">
                <span>
                  <span className="category-dot green"></span>
                  Hải Sản
                </span>
                <span className="category-percent">34%</span>
              </div>
              <div className="category-item">
                <span>
                  <span className="category-dot yellow"></span>
                  Đặc Sản
                </span>
                <span className="category-percent">21%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard__bottom">
        <div className="dashboard__new-products">
          <div className="section-header">
            <h3>Sản Phẩm Mới</h3>
            <button className="view-all">Xem tất cả</button>
          </div>
          <div className="products-list">
            {newProducts.length > 0 ? (
              newProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <img 
                    src={product.image_url || 'https://via.placeholder.com/44x44/3498db/ffffff?text=SP'} 
                    alt={product.name} 
                  />
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>{formatCurrency(product.price)}</p>
                  </div>
                  <span className="product-status">Còn {product.stock}</span>
                </div>
              ))
            ) : (
              <div className="product-item">
                <img src="https://via.placeholder.com/44x44" alt="Sample" />
                <div className="product-info">
                  <h4>Cà phê đặc sản</h4>
                  <p>250,000đ</p>
                </div>
                <span className="product-status">Còn 50</span>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard__recent-activities">
          <div className="section-header">
            <h3>Hoạt Động Gần Đây</h3>
            <button className="view-all">Xem tất cả</button>
          </div>
          <div className="activities-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'order' && <FaShoppingBag />}
                    {activity.type === 'product' && <FaBox />}
                    {activity.type === 'return' && <FaExchangeAlt />}
                  </div>
                  <div className="activity-content">
                    <p>{activity.description}</p>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="activity-item">
                  <div className="activity-icon">
                    <FaShoppingBag />
                  </div>
                  <div className="activity-content">
                    <p>Đơn hàng #DH001 đã được thanh toán</p>
                    <span>5 phút trước</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <FaBox />
                  </div>
                  <div className="activity-content">
                    <p>Sản phẩm mới "Cà phê đặc sản" được thêm</p>
                    <span>1 giờ trước</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;