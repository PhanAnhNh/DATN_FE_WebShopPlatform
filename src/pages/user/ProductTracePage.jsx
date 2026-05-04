// pages/user/product/ProductTracePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  FaSeedling, FaIndustry, FaCogs, FaTruck, FaStore, FaCertificate,
  FaCalendarAlt, FaMapMarkerAlt, FaUser, FaImage, FaCheckCircle,
  FaClock, FaSpinner, FaArrowLeft, FaShareAlt, FaDownload
} from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import ShopDetailLayout from '../../components/layout/ShopDetailLayout';
import '../../css/ProductTracePage.css';

const ProductTracePage = () => {
  const { product_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [traceData, setTraceData] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    fetchTraceData();
  }, [product_id]);

  const fetchTraceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/products/${product_id}/trace`);
      setTraceData(response.data);
    } catch (error) {
      console.error('Error fetching trace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stageIcons = {
    cultivation: <FaSeedling size={24} />,
    production: <FaIndustry size={24} />,
    processing: <FaCogs size={24} />,
    transportation: <FaTruck size={24} />,
    distribution: <FaStore size={24} />,
    certification: <FaCertificate size={24} />
  };

  const stageColors = {
    cultivation: '#4caf50',
    production: '#2196f3',
    processing: '#ff9800',
    transportation: '#9c27b0',
    distribution: '#f44336',
    certification: '#009688'
  };

  const stageNames = {
    cultivation: 'Nuôi trồng',
    production: 'Sản xuất',
    processing: 'Chế biến',
    transportation: 'Vận chuyển',
    distribution: 'Phân phối',
    certification: 'Chứng nhận'
  };

  if (loading) {
    return (
      <ShopDetailLayout>
        <div className="trace-loading">
          <FaSpinner className="spinning" />
          <p>Đang tải thông tin truy xuất nguồn gốc...</p>
        </div>
      </ShopDetailLayout>
    );
  }

  if (!traceData) {
    return (
      <ShopDetailLayout>
        <div className="trace-error">
          <h2>Không tìm thấy thông tin</h2>
          <button onClick={() => navigate(-1)}>Quay lại</button>
        </div>
      </ShopDetailLayout>
    );
  }

  const { product, stages, trace_events } = traceData;
  const hasTraceability = product.has_traceability && trace_events && trace_events.length > 0;

  return (
    <ShopDetailLayout>
      <div className="product-trace-page">
        <div className="trace-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Quay lại
          </button>
          <h1>Truy xuất nguồn gốc sản phẩm</h1>
        </div>

        {/* Product Info */}
        <div className="product-info-card">
          <img src={product.image_url || '/placeholder.png'} alt={product.name} />
          <div className="product-info">
            <h2>{product.name}</h2>
            <p className="product-description">{product.description}</p>
            <div className="product-meta">
              {product.origin && (
                <span className="meta-tag">
                  <FaMapMarkerAlt /> Xuất xứ: {product.origin}
                </span>
              )}
              {product.certification && (
                <span className="meta-tag certification">
                  <FaCertificate /> {product.certification}
                </span>
              )}
            </div>
          </div>
        </div>

        {!hasTraceability ? (
          <div className="no-traceability">
            <div className="no-trace-icon">🔍</div>
            <h3>Chưa có thông tin truy xuất nguồn gốc</h3>
            <p>Sản phẩm này hiện chưa được cập nhật thông tin truy xuất nguồn gốc chi tiết.</p>
            {product.origin && (
              <div className="basic-info">
                <h4>Thông tin cơ bản:</h4>
                <p><strong>Xuất xứ:</strong> {product.origin}</p>
                {product.certification && <p><strong>Chứng nhận:</strong> {product.certification}</p>}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Stages Overview */}
            <div className="stages-overview">
              <h3>Quy trình sản xuất</h3>
              <div className="stages-grid">
                {Object.entries(stages).map(([key, stage]) => (
                  stage.events.length > 0 && (
                    <div 
                      key={key}
                      className={`stage-card ${selectedStage === key ? 'active' : ''}`}
                      onClick={() => setSelectedStage(selectedStage === key ? null : key)}
                      style={{ borderTopColor: stageColors[key] }}
                    >
                      <div className="stage-icon" style={{ color: stageColors[key] }}>
                        {stageIcons[key]}
                      </div>
                      <div className="stage-info">
                        <h4>{stage.name}</h4>
                        <span className="event-count">{stage.events.length} giai đoạn</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="trace-timeline">
              <h3>Lộ trình chi tiết</h3>
              <div className="timeline">
                {trace_events.map((event, index) => {
                  const stageKey = event.stage;
                  const isSelected = selectedStage === null || selectedStage === stageKey;
                  
                  if (!isSelected) return null;
                  
                  return (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker" style={{ backgroundColor: stageColors[stageKey] }}>
                        {stageIcons[stageKey]}
                      </div>
                      <div className="timeline-content">
                        <div className="event-stage-badge" style={{ backgroundColor: stageColors[stageKey] }}>
                          {stageNames[stageKey]}
                        </div>
                        <h4>{event.title}</h4>
                        <p className="event-description">{event.description}</p>
                        <div className="event-meta">
                          {event.location && (
                            <span><FaMapMarkerAlt /> {event.location}</span>
                          )}
                          {event.date && (
                            <span><FaCalendarAlt /> {new Date(event.date).toLocaleDateString('vi-VN')}</span>
                          )}
                          {event.responsible_party && (
                            <span><FaUser /> {event.responsible_party}</span>
                          )}
                        </div>
                        {event.images && event.images.length > 0 && (
                          <div className="event-images">
                            {event.images.map((img, idx) => (
                              <img key={idx} src={img} alt={`Event ${index} image ${idx}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="qr-code-section">
              <h3>Mã QR truy xuất</h3>
              <div className="qr-container">
                <QRCodeCanvas
                  value={`${window.location.origin}/product/${product_id}/trace`}
                  size={120}
                  level="H"
                />
                <p>Quét mã để xem lại thông tin này</p>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .product-trace-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .trace-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #f5f5f5;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: #e0e0e0;
        }

        .trace-header h1 {
          margin: 0;
          font-size: 28px;
          color: #333;
        }

        .product-info-card {
          display: flex;
          gap: 32px;
          background: white;
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .product-info-card img {
          width: 180px;
          height: 180px;
          object-fit: cover;
          border-radius: 16px;
        }

        .product-info {
          flex: 1;
        }

        .product-info h2 {
          margin: 0 0 12px 0;
          font-size: 24px;
          color: #333;
        }

        .product-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .product-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f0f0f0;
          border-radius: 20px;
          font-size: 13px;
          color: #666;
        }

        .meta-tag.certification {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .stages-overview {
          margin-bottom: 48px;
        }

        .stages-overview h3 {
          margin-bottom: 20px;
          font-size: 20px;
          color: #333;
        }

        .stages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .stage-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          border-top: 4px solid;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .stage-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .stage-card.active {
          background: #f5f5f5;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .stage-icon {
          font-size: 28px;
        }

        .stage-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }

        .event-count {
          font-size: 12px;
          color: #999;
        }

        .trace-timeline h3 {
          margin-bottom: 24px;
          font-size: 20px;
          color: #333;
        }

        .timeline {
          position: relative;
          padding-left: 30px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e0e0e0;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 32px;
        }

        .timeline-marker {
          position: absolute;
          left: -30px;
          top: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 1;
        }

        .timeline-content {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-left: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .event-stage-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .timeline-content h4 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #333;
        }

        .event-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .event-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
          font-size: 13px;
          color: #999;
        }

        .event-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .event-images {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .event-images img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          cursor: pointer;
        }

        .qr-code-section {
          text-align: center;
          padding: 32px;
          background: white;
          border-radius: 24px;
          margin-top: 32px;
        }

        .qr-code-section h3 {
          margin-bottom: 20px;
        }

        .qr-container {
          display: inline-block;
          text-align: center;
        }

        .qr-container p {
          margin-top: 12px;
          font-size: 13px;
          color: #999;
        }

        .no-traceability {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 24px;
        }

        .no-trace-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-traceability h3 {
          margin-bottom: 12px;
          color: #333;
        }

        .no-traceability p {
          color: #666;
          margin-bottom: 24px;
        }

        .basic-info {
          text-align: left;
          max-width: 400px;
          margin: 24px auto 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 16px;
        }

        .basic-info h4 {
          margin-bottom: 12px;
          color: #333;
        }

        .basic-info p {
          margin: 8px 0;
        }

        .trace-loading, .trace-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinning {
          animation: spin 1s linear infinite;
          font-size: 48px;
          color: #4caf50;
          margin-bottom: 20px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ShopDetailLayout>
  );
};

export default ProductTracePage;