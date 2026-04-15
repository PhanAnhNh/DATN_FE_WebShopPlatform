// src/pages/shop/ProductTraceability.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaArrowLeft, FaSave, FaPlus, FaTrash, FaEdit, FaTimes,
  FaSeedling, FaIndustry, FaCogs, FaTruck, FaStore, FaCertificate,
  FaCalendarAlt, FaMapMarkerAlt, FaUser, FaImage, FaFileAlt,
  FaSpinner, FaQrcode, FaDownload, FaShareAlt
} from 'react-icons/fa';
import { shopApi } from '../../api/api';
import { QRCodeCanvas } from 'qrcode.react';
import '../../css/ProductTraceability.css';

const ProductTraceability = ({ productId, productName, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [traceability, setTraceability] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    stage: 'cultivation',
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString().slice(0, 16),
    responsible_party: '',
    images: []
  });

  const stages = [
    { value: 'cultivation', label: 'Nuôi trồng', icon: <FaSeedling />, color: '#4caf50' },
    { value: 'production', label: 'Sản xuất', icon: <FaIndustry />, color: '#2196f3' },
    { value: 'processing', label: 'Chế biến', icon: <FaCogs />, color: '#ff9800' },
    { value: 'transportation', label: 'Vận chuyển', icon: <FaTruck />, color: '#9c27b0' },
    { value: 'distribution', label: 'Phân phối', icon: <FaStore />, color: '#f44336' },
    { value: 'certification', label: 'Chứng nhận', icon: <FaCertificate />, color: '#009688' }
  ];

  useEffect(() => {
    fetchTraceability();
  }, [productId]);

  // src/pages/shop/ProductTraceability.jsx
  const fetchTraceability = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get(`/api/v1/traceability/products/${productId}`);
      const data = response.data;
      
      const hasTraceability = data.has_traceability === true || 
                            (data.trace_events && Array.isArray(data.trace_events));
      
      setTraceability({
        ...data,
        has_traceability: hasTraceability,
        trace_events: data.trace_events || []
      });
    } catch (error) {
      console.error('Error fetching traceability:', error);
      if (error.response?.status === 404) {
        setTraceability({ 
          has_traceability: false, 
          trace_events: [],
          product_id: productId
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTraceability = async () => {
    try {
      setSaving(true);
      const response = await shopApi.post(`/api/v1/traceability/products/${productId}`, {
        trace_events: []
      });
      
      // Sau khi tạo thành công, fetch lại dữ liệu mới
      await fetchTraceability();
      
      alert('Đã tạo hệ thống truy xuất nguồn gốc! Bạn có thể thêm các giai đoạn sản xuất.');
    } catch (error) {
      console.error('Error creating traceability:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventForm.title || !eventForm.description) {
      alert('Vui lòng nhập tiêu đề và mô tả');
      return;
    }

    try {
      setSaving(true);
      const eventData = {
        ...eventForm,
        date: new Date(eventForm.date).toISOString(),
        images: eventForm.images.filter(img => img)
      };

      if (editingEvent) {
        // Update event
        await shopApi.put(
          `/api/v1/traceability/products/${productId}/events/${editingEvent.index}`,
          eventData
        );
      } else {
        // Add new event
        await shopApi.post(
          `/api/v1/traceability/products/${productId}/events`,
          eventData
        );
      }

      await fetchTraceability();
      setShowEventModal(false);
      resetEventForm();
      alert(editingEvent ? 'Cập nhật thành công!' : 'Thêm event thành công!');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventIndex) => {
    if (!window.confirm('Bạn có chắc muốn xóa event này?')) return;

    try {
      await shopApi.delete(`/api/v1/traceability/products/${productId}/events/${eventIndex}`);
      await fetchTraceability();
      alert('Xóa event thành công!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleEditEvent = (event, index) => {
    setEditingEvent({ ...event, index });
    setEventForm({
      stage: event.stage,
      title: event.title,
      description: event.description,
      location: event.location || '',
      date: new Date(event.date).toISOString().slice(0, 16),
      responsible_party: event.responsible_party || '',
      images: event.images || []
    });
    setShowEventModal(true);
  };

  const resetEventForm = () => {
    setEditingEvent(null);
    setEventForm({
      stage: 'cultivation',
      title: '',
      description: '',
      location: '',
      date: new Date().toISOString().slice(0, 16),
      responsible_party: '',
      images: []
    });
  };

  const getStageInfo = (stageValue) => {
    return stages.find(s => s.value === stageValue) || stages[0];
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('traceability-qr-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `traceability-${productName}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="traceability-loading">
        <FaSpinner className="spinning" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="product-traceability">
      <div className="traceability-header">
        <button className="back-btn" onClick={onClose}>
          <FaArrowLeft /> Quay lại
        </button>
        <h2>Truy xuất nguồn gốc: {productName}</h2>
        <button className="save-btn" onClick={onSave}>
          <FaSave /> Lưu
        </button>
      </div>

      {!traceability?.has_traceability ? (
        <div className="no-traceability">
          <FaQrcode size={80} color="#ccc" />
          <h3>Chưa có thông tin truy xuất nguồn gốc</h3>
          <p>Thiết lập truy xuất nguồn gốc để khách hàng có thể xem được quy trình sản xuất sản phẩm</p>
          <button onClick={handleCreateTraceability} disabled={saving}>
            {saving ? <FaSpinner className="spinning" /> : <FaPlus />}
            Thiết lập truy xuất nguồn gốc
          </button>
        </div>
      ) : (
        <>
          {/* QR Code Section */}
          <div className="qr-code-section">
            <div className="qr-code-container">
              <h3>Mã QR truy xuất</h3>
              <QRCodeCanvas
                id="traceability-qr-canvas"
                value={`${window.location.origin}/product/${productId}/trace`}
                size={150}
                level="H"
                includeMargin={true}
              />
              <button className="download-qr-btn" onClick={handleDownloadQR}>
                <FaDownload /> Tải mã QR
              </button>
              <p className="qr-hint">Quét mã để xem thông tin truy xuất nguồn gốc</p>
            </div>
          </div>

          {/* Trace Events Timeline */}
          <div className="trace-events-section">
            <div className="section-header">
              <h3>Lộ trình sản phẩm</h3>
              <button className="add-event-btn" onClick={() => setShowEventModal(true)}>
                <FaPlus /> Thêm giai đoạn
              </button>
            </div>

            {(!traceability.trace_events || traceability.trace_events.length === 0) ? (
              <div className="empty-events">
                <p>Chưa có giai đoạn nào. Hãy thêm các giai đoạn để khách hàng theo dõi!</p>
              </div>
            ) : (
              <div className="timeline">
                {traceability.trace_events.map((event, index) => {
                  const stageInfo = getStageInfo(event.stage);
                  return (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker" style={{ backgroundColor: stageInfo.color }}>
                        {stageInfo.icon}
                      </div>
                      <div className="timeline-content">
                        <div className="event-header">
                          <div className="event-stage">
                            <span className="stage-badge" style={{ backgroundColor: stageInfo.color }}>
                              {stageInfo.label}
                            </span>
                            <h4>{event.title}</h4>
                          </div>
                          <div className="event-actions">
                            <button onClick={() => handleEditEvent(event, index)}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteEvent(index)}>
                              <FaTrash />
                            </button>
                          </div>
                        </div>
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
            )}
          </div>
        </>
      )}

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => {
          setShowEventModal(false);
          resetEventForm();
        }}>
          <div className="modal-content event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Chỉnh sửa giai đoạn' : 'Thêm giai đoạn mới'}</h2>
              <button className="close-btn" onClick={() => {
                setShowEventModal(false);
                resetEventForm();
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Giai đoạn *</label>
                <select
                  value={eventForm.stage}
                  onChange={(e) => setEventForm({ ...eventForm, stage: e.target.value })}
                >
                  {stages.map(stage => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="VD: Gieo hạt giống, Thu hoạch, Đóng gói..."
                />
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết *</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows="4"
                  placeholder="Mô tả chi tiết về giai đoạn này..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Địa điểm</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Địa điểm thực hiện"
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian</label>
                  <input
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Đơn vị thực hiện</label>
                <input
                  type="text"
                  value={eventForm.responsible_party}
                  onChange={(e) => setEventForm({ ...eventForm, responsible_party: e.target.value })}
                  placeholder="Tên cơ sở/đơn vị thực hiện"
                />
              </div>

              <div className="form-group">
                <label>Hình ảnh (URL, cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={eventForm.images.join(', ')}
                  onChange={(e) => setEventForm({ 
                    ...eventForm, 
                    images: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowEventModal(false);
                resetEventForm();
              }}>
                Hủy
              </button>
              <button className="save-btn" onClick={handleAddEvent} disabled={saving}>
                {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                {editingEvent ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ProductTraceability;