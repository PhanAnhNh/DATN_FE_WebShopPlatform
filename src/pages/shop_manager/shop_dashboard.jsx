// src/pages/shop/ShopDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaShoppingBag, 
  FaBox, 
  FaMoneyBillWave, 
  FaExchangeAlt,
  FaDownload,
  FaSpinner
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
  Filler
} from 'chart.js';
import { shopApi } from '../../api/api';
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
  // Thêm refs cho các container chart
  const chartContainerRef = useRef(null);
  const barChartContainerRef = useRef(null);
  const doughnutContainerRef = useRef(null);
  
  // Thêm refs cho các chart components
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  
  const [stats, setStats] = useState({
    products: {
      total: 0,
      in_stock: 0,
      out_of_stock: 0
    },
    orders: {
      total: 0,
      today: 0
    },
    revenue: {
      total: 0,
      this_month: 0
    },
    shop: {
      name: '',
      logo_url: '',
      is_verified: false,
      followers_count: 0
    }
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    orders: [],
    revenue: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm resize charts
  const resizeCharts = () => {
    if (lineChartRef.current) {
      lineChartRef.current.chartInstance?.resize();
    }
    if (barChartRef.current) {
      barChartRef.current.chartInstance?.resize();
    }
    if (doughnutChartRef.current) {
      doughnutChartRef.current.chartInstance?.resize();
    }
  };

  useEffect(() => {
    // Kiểm tra token trước khi fetch
    const shopToken = localStorage.getItem('shop_token');
    if (!shopToken) {
      console.log('No shop token found, redirecting to login...');
      window.location.href = '/shop/login';
      return;
    }
    
    fetchDashboardData();
    fetchChartData();
    
    // Sử dụng ResizeObserver để theo dõi sự thay đổi kích thước
    const resizeObserver = new ResizeObserver(() => {
      resizeCharts();
    });
    
    // Theo dõi container chính hoặc window
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    if (barChartContainerRef.current) {
      resizeObserver.observe(barChartContainerRef.current);
    }
    if (doughnutContainerRef.current) {
      resizeObserver.observe(doughnutContainerRef.current);
    }
    
    // Lắng nghe sự kiện resize của window
    window.addEventListener('resize', resizeCharts);
    
    // Lắng nghe sự kiện zoom (cho mobile)
    window.addEventListener('touchmove', resizeCharts);
    window.addEventListener('gesturechange', resizeCharts);
    
    return () => {
      setStats({});
      setRecentActivities([]);
      setNewProducts([]);
      
      // Cleanup
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCharts);
      window.removeEventListener('touchmove', resizeCharts);
      window.removeEventListener('gesturechange', resizeCharts);
    };
  }, []);

  // Thêm useEffect để resize charts khi chartData thay đổi
  useEffect(() => {
    if (!loading && chartData) {
      // Delay nhỏ để đảm bảo DOM đã được render
      setTimeout(resizeCharts, 100);
    }
  }, [chartData, loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data with shop token...');
      
      const statsRes = await shopApi.get('/api/v1/shop/dashboard/stats');
      console.log('Dashboard stats:', statsRes.data);
      setStats(statsRes.data);
      
      const activitiesRes = await shopApi.get('/api/v1/shop/dashboard/recent-activities');
      setRecentActivities(activitiesRes.data);
      
      const productsRes = await shopApi.get('/api/v1/shop/products?limit=5&sort=newest');
      setNewProducts(productsRes.data.data || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, redirecting to login...');
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_info');
        window.location.href = '/shop/login';
        return;
      }
      
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      
      setStats({
        products: {
          total: 1000,
          in_stock: 950,
          out_of_stock: 50
        },
        orders: {
          total: 15000,
          today: 45
        },
        revenue: {
          total: 10000000,
          this_month: 2500000
        },
        shop: {
          name: 'Đặc Sản Quê Tôi',
          logo_url: null,
          is_verified: true,
          followers_count: 1200
        }
      });
      
      setRecentActivities([
        { type: 'order', description: 'Đơn hàng #DH001 đã được thanh toán', time: '5 phút trước' },
        { type: 'product', description: 'Sản phẩm mới "Cà phê đặc sản" được thêm', time: '1 giờ trước' },
        { type: 'return', description: 'Yêu cầu đổi trả #RT001 đã được xử lý', time: '2 giờ trước' },
        { type: 'order', description: 'Đơn hàng #DH002 đã được giao thành công', time: '3 giờ trước' },
        { type: 'product', description: 'Sản phẩm "Mật ong rừng" hết hàng', time: '5 giờ trước' }
      ]);
      
      setNewProducts([
        { id: '1', name: 'Cà phê đặc sản', price: 250000, stock: 50, image_url: null },
        { id: '2', name: 'Mật ong rừng', price: 180000, stock: 30, image_url: null },
        { id: '3', name: 'Gạo lứt đen', price: 120000, stock: 100, image_url: null },
        { id: '4', name: 'Nấm linh chi', price: 350000, stock: 25, image_url: null },
        { id: '5', name: 'Trà shan tuyết', price: 280000, stock: 40, image_url: null }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await shopApi.get('/api/v1/shop/dashboard/chart-data?days=7');
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData({
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        orders: [45, 52, 48, 70, 85, 92, 78],
        revenue: [1200000, 1900000, 1500000, 2100000, 2400000, 2800000, 3100000]
      });
    }
  };

  // Dữ liệu cho biểu đồ lượt truy cập (dùng revenue thay vì traffic)
  const revenueData = {
    labels: chartData.labels.length > 0 ? chartData.labels : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Doanh thu',
        data: chartData.revenue.length > 0 ? chartData.revenue : [1200000, 1900000, 1500000, 2100000, 2400000, 2800000, 3100000],
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

  // Dữ liệu cho biểu đồ đơn hàng
  const ordersData = {
    labels: chartData.labels.length > 0 ? chartData.labels : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: chartData.orders.length > 0 ? chartData.orders : [45, 52, 48, 70, 85, 92, 78],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderRadius: 6
      }
    ]
  };

  // Dữ liệu cho biểu đồ tròn (category distribution - tạm thời dùng mẫu)
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
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
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
    },
    elements: {
      line: {
        tension: 0.4
      }
    },
    // Thêm option để cập nhật khi resize
    animation: {
      duration: 0
    },
    // Đảm bảo chart resize chính xác
    resizeDelay: 0
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
    },
    animation: {
      duration: 0
    },
    resizeDelay: 0
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
    },
    animation: {
      duration: 0
    },
    resizeDelay: 0
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'tr';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <FaSpinner className="spinning" size={40} color="#2e7d32" />
          <p style={{ marginLeft: '10px' }}>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error" style={{ 
          textAlign: 'center', 
          padding: '50px',
          color: '#dc3545'
        }}>
          <p>{error}</p>
          <button 
            onClick={fetchDashboardData}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#2e7d32',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" ref={chartContainerRef}>
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
            <h3 className="stat-card__value">{formatNumber(stats.orders?.total || 0)}</h3>
            <p className="stat-card__label">Lượt Mua</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon green">
            <FaBox />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatNumber(stats.products?.total || 0)}</h3>
            <p className="stat-card__label">Sản Phẩm</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon purple">
            <FaMoneyBillWave />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatCurrency(stats.revenue?.total || 0)}</h3>
            <p className="stat-card__label">Thu Nhập</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon orange">
            <FaExchangeAlt />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{formatNumber(stats.products?.out_of_stock || 0)}</h3>
            <p className="stat-card__label">Hết Hàng</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard__charts">
        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Doanh Thu 7 Ngày Qua</h3>
            <button className="chart-card__export">
              <FaDownload /> Tải báo cáo
            </button>
          </div>
          <div className="chart-card__body" ref={chartContainerRef}>
            <Line 
              ref={lineChartRef}
              data={revenueData} 
              options={lineOptions}
              // Thêm redraw để force update khi cần
              redraw={false}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Số Lượng Đơn Hàng</h3>
          </div>
          <div className="chart-card__body" ref={barChartContainerRef}>
            <Bar 
              ref={barChartRef}
              data={ordersData} 
              options={barOptions}
              redraw={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard__bottom">
        <div className="dashboard__new-products">
          <div className="section-header">
            <h3>Sản Phẩm Mới</h3>
            <button className="view-all" onClick={() => window.location.href = '/shop/products'}>
              Xem tất cả
            </button>
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

      <style>{`
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

export default ShopDashboard;