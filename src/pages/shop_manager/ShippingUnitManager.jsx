// src/pages/shop/ShopShippingUnitManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/api';
import { Truck, Edit2, Trash2, Power, Plus, Package, DollarSign, CheckCircle, XCircle, AlertCircle, Eye, MapPin, Clock, Phone, Mail, Globe } from 'lucide-react';
import '../../css/ShippingUnitManager.css';

const ShopShippingUnitManager = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0, orders: 0 });
  const [modal, setModal] = useState({ open: false, unit: null, mode: 'create' }); // mode: create, edit, view
  const [form, setForm] = useState({
    name: '', code: '', logo_url: '', description: '', website: '', phone: '', email: '',
    shipping_fee_base: 0, free_shipping_threshold: '', estimated_delivery_days: 3,
    supported_provinces: [], status: 'active'
  });
  const [newProvince, setNewProvince] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy danh sách đơn vị vận chuyển
      const unitsRes = await shopApi.get('/api/v1/shipping-units/shop');
      console.log('Units response:', unitsRes.data);
      
      // Lấy thống kê
      const statsRes = await shopApi.get('/api/v1/shipping-units/shop/stats').catch(() => ({ data: [] }));
      console.log('Stats response:', statsRes.data);
      
      // Xử lý dữ liệu units
      let unitsData = [];
      if (unitsRes.data && unitsRes.data.data) {
        unitsData = unitsRes.data.data;
      } else if (Array.isArray(unitsRes.data)) {
        unitsData = unitsRes.data;
      } else if (unitsRes.data && unitsRes.data.items) {
        unitsData = unitsRes.data.items;
      }
      
      setUnits(unitsData);
      
      // Tính stats từ unitsData nếu API stats không có
      const statsData = statsRes.data || [];
      setStats({
        total: unitsData.length,
        active: unitsData.filter(u => u.status === 'active').length,
        revenue: statsData.reduce((s, i) => s + (i.total_revenue || 0), 0),
        orders: statsData.reduce((s, i) => s + (i.total_orders || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) navigate('/shop/login');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, unit = null) => {
    if (unit) {
      setForm({
        name: unit.name || '',
        code: unit.code || '',
        logo_url: unit.logo_url || '',
        description: unit.description || '',
        website: unit.website || '',
        phone: unit.phone || '',
        email: unit.email || '',
        shipping_fee_base: unit.shipping_fee_base || 0,
        free_shipping_threshold: unit.free_shipping_threshold || '',
        estimated_delivery_days: unit.estimated_delivery_days || 3,
        supported_provinces: unit.supported_provinces || [],
        status: unit.status || 'active'
      });
    } else {
      setForm({
        name: '', code: '', logo_url: '', description: '', website: '', phone: '', email: '',
        shipping_fee_base: 0, free_shipping_threshold: '', estimated_delivery_days: 3,
        supported_provinces: [], status: 'active'
      });
    }
    setModal({ open: true, unit, mode });
    setNewProvince('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      free_shipping_threshold: form.free_shipping_threshold ? Number(form.free_shipping_threshold) : null,
      shipping_fee_base: Number(form.shipping_fee_base),
      estimated_delivery_days: Number(form.estimated_delivery_days),
      logo_url: form.logo_url || null,
      website: form.website || null,
      phone: form.phone || null,
      email: form.email || null
    };
    
    try {
      if (modal.mode === 'edit' && modal.unit) {
        await shopApi.put(`/api/v1/shipping-units/shop/${modal.unit.id}`, data);
      } else if (modal.mode === 'create') {
        await shopApi.post('/api/v1/shipping-units/shop', data);
      }
      setModal({ open: false, unit: null, mode: 'create' });
      fetchData();
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleStatusToggle = async (unit) => {
    const newStatus = unit.status === 'active' ? 'inactive' : 'active';
    try {
      await shopApi.patch(`/api/v1/shipping-units/shop/${unit.id}/status?status=${newStatus}`);
      fetchData();
    } catch (err) {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị vận chuyển này?')) {
      try {
        await shopApi.delete(`/api/v1/shipping-units/shop/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Không thể xóa đơn vị vận chuyển');
      }
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={24} /></div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const config = {
      active: { icon: CheckCircle, text: 'Hoạt động', class: 'active' },
      inactive: { icon: XCircle, text: 'Không hoạt động', class: 'inactive' },
      suspended: { icon: AlertCircle, text: 'Tạm ngưng', class: 'suspended' }
    };
    const { icon: Icon, text, class: cls } = config[status] || config.inactive;
    return <span className={`status-badge ${cls}`}><Icon size={12} /> {text}</span>;
  };

  // Component View Detail Modal
  // Component View Detail Modal - Phiên bản hiển thị ngang theo bảng
const ViewDetailModal = ({ unit, onClose }) => (
  <div className="modal" onClick={onClose}>
    <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Chi tiết đơn vị vận chuyển</h2>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      
      <div className="view-detail-content">
        {/* Header thông tin */}
        <div className="view-header">
          <div className="view-avatar">
            {unit.logo_url ? <img src={unit.logo_url} alt={unit.name} /> : <Truck size={40} />}
          </div>
          <div className="view-info">
            <h3>{unit.name}</h3>
            <span className="unit-code">{unit.code}</span>
            <StatusBadge status={unit.status} />
          </div>
        </div>

        {/* Bảng thông tin - Layout ngang */}
        <div className="info-grid">
          {/* Thông tin liên hệ */}
          <div className="info-card">
            <div className="info-card-header">
              <Phone size={18} />
              <h4>Thông tin liên hệ</h4>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <span className="info-label">Điện thoại:</span>
                <span className="info-value">{unit.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{unit.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Website:</span>
                <span className="info-value">
                  {unit.website ? (
                    <a href={unit.website} target="_blank" rel="noopener noreferrer">{unit.website}</a>
                  ) : 'Chưa cập nhật'}
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin vận chuyển */}
          <div className="info-card">
            <div className="info-card-header">
              <Truck size={18} />
              <h4>Thông tin vận chuyển</h4>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <span className="info-label">Phí ship cơ bản:</span>
                <span className="info-value highlight">{unit.shipping_fee_base?.toLocaleString()}đ</span>
              </div>
              <div className="info-row">
                <span className="info-label">Miễn phí ship:</span>
                <span className="info-value">
                  {unit.free_shipping_threshold ? `≥ ${unit.free_shipping_threshold.toLocaleString()}đ` : 'Không áp dụng'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Thời gian giao:</span>
                <span className="info-value">{unit.estimated_delivery_days} ngày</span>
              </div>
            </div>
          </div>

          {/* Khu vực hỗ trợ */}
          <div className="info-card full-width">
            <div className="info-card-header">
              <MapPin size={18} />
              <h4>Khu vực hỗ trợ</h4>
            </div>
            <div className="info-card-content">
              <div className="province-tags">
                {unit.supported_provinces?.length > 0 ? (
                  unit.supported_provinces.map(p => (
                    <span key={p} className="province-tag">
                      <MapPin size={12} /> {p}
                    </span>
                  ))
                ) : (
                  <span className="no-data">Hỗ trợ toàn quốc</span>
                )}
              </div>
            </div>
          </div>

          {/* Thống kê */}
          <div className="info-card">
            <div className="info-card-header">
              <Package size={18} />
              <h4>Thống kê</h4>
            </div>
            <div className="info-card-content stats-content">
              <div className="stat-box">
                <div className="stat-number">{unit.total_orders || 0}</div>
                <div className="stat-label-small">đơn hàng</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-box">
                <div className="stat-number">{(unit.total_revenue || 0).toLocaleString()}đ</div>
                <div className="stat-label-small">doanh thu</div>
              </div>
            </div>
          </div>

          {/* Mô tả (nếu có) */}
          {unit.description && (
            <div className="info-card full-width">
              <div className="info-card-header">
                <AlertCircle size={18} />
                <h4>Mô tả</h4>
              </div>
              <div className="info-card-content">
                <p className="description-text">{unit.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      
    </div>
  </div>
);

  if (loading) return (
    <div className="loader">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="shipping-manager">
      <div className="manager-header">
        <div>
          <h1>Đơn vị vận chuyển</h1>
          <p>Quản lý các đơn vị vận chuyển của cửa hàng</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('create')}>
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={Package} label="Tổng đơn vị" value={stats.total} color="green" />
        <StatCard icon={CheckCircle} label="Đang hoạt động" value={stats.active} color="blue" />
        <StatCard icon={DollarSign} label="Doanh thu ship" value={`${stats.revenue.toLocaleString()}đ`} color="orange" />
        <StatCard icon={Truck} label="Đơn hàng đã ship" value={stats.orders} color="purple" />
      </div>

      {units.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Truck size={48} /></div>
          <h3>Chưa có đơn vị vận chuyển</h3>
          <p>Thêm đơn vị vận chuyển đầu tiên để bắt đầu</p>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <Plus size={18} /> Thêm đơn vị
          </button>
        </div>
      ) : (
        <div className="units-grid">
          {units.map(unit => (
            <div key={unit.id || unit._id} className="unit-card">
              <div className="card-top">
                <div className="unit-avatar">
                  {unit.logo_url ? <img src={unit.logo_url} alt={unit.name} /> : <Truck size={28} />}
                </div>
                <div className="unit-info">
                  <h3>{unit.name}</h3>
                  <span className="unit-code">{unit.code}</span>
                </div>
                <StatusBadge status={unit.status} />
              </div>
              
              <div className="card-details">
                <div className="detail-row">
                  <span>Phí ship cơ bản</span>
                  <strong>{unit.shipping_fee_base?.toLocaleString()}đ</strong>
                </div>
                <div className="detail-row">
                  <span>Miễn phí ship</span>
                  <strong>{unit.free_shipping_threshold ? `≥ ${unit.free_shipping_threshold.toLocaleString()}đ` : 'Không'}</strong>
                </div>
                <div className="detail-row">
                  <span>Thời gian giao</span>
                  <strong>{unit.estimated_delivery_days} ngày</strong>
                </div>
                {unit.supported_provinces?.length > 0 && (
                  <div className="detail-row">
                    <span>Hỗ trợ</span>
                    <div className="province-pills">
                      {unit.supported_provinces.slice(0, 3).map(p => <span key={p}>{p}</span>)}
                      {unit.supported_provinces.length > 3 && <span>+{unit.supported_provinces.length - 3}</span>}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <button className="action-btn view" onClick={() => openModal('view', unit)}>
                  <Eye size={16} /> Xem
                </button>
                <button className="action-btn edit" onClick={() => openModal('edit', unit)}>
                  <Edit2 size={16} /> Sửa
                </button>
                <button 
                  className={`action-btn status ${unit.status === 'active' ? 'deactivate' : 'activate'}`} 
                  onClick={() => handleStatusToggle(unit)}
                >
                  <Power size={16} /> {unit.status === 'active' ? 'Vô hiệu' : 'Kích hoạt'}
                </button>
                <button className="action-btn delete" onClick={() => handleDelete(unit.id)}>
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {modal.open && modal.mode !== 'view' && (
        <div className="modal" onClick={() => setModal({ open: false, unit: null, mode: 'create' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal.mode === 'edit' ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}</h2>
              <button className="modal-close" onClick={() => setModal({ open: false, unit: null, mode: 'create' })}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên đơn vị *</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mã đơn vị *</label>
                  <input 
                    name="code" 
                    value={form.code} 
                    onChange={e => setForm({ ...form, code: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phí ship cơ bản (VNĐ) *</label>
                  <input 
                    type="number" 
                    name="shipping_fee_base" 
                    value={form.shipping_fee_base} 
                    onChange={e => setForm({ ...form, shipping_fee_base: +e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Miễn phí ship (VNĐ)</label>
                  <input 
                    type="number" 
                    name="free_shipping_threshold" 
                    value={form.free_shipping_threshold} 
                    onChange={e => setForm({ ...form, free_shipping_threshold: e.target.value })} 
                    placeholder="Không áp dụng" 
                  />
                </div>
                <div className="form-group">
                  <label>Thời gian giao (ngày) *</label>
                  <input 
                    type="number" 
                    name="estimated_delivery_days" 
                    value={form.estimated_delivery_days} 
                    onChange={e => setForm({ ...form, estimated_delivery_days: +e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Điện thoại</label>
                  <input 
                    name="phone" 
                    value={form.phone || ''} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={form.email || ''} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Logo URL</label>
                  <input 
                    name="logo_url" 
                    value={form.logo_url || ''} 
                    onChange={e => setForm({ ...form, logo_url: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input 
                    name="website" 
                    value={form.website || ''} 
                    onChange={e => setForm({ ...form, website: e.target.value })} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea 
                  rows="2" 
                  value={form.description || ''} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Tỉnh/Thành hỗ trợ</label>
                <div className="province-input">
                  <input 
                    value={newProvince} 
                    onChange={e => setNewProvince(e.target.value)} 
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newProvince && !form.supported_provinces.includes(newProvince)) {
                          setForm({ ...form, supported_provinces: [...form.supported_provinces, newProvince] });
                          setNewProvince('');
                        }
                      }
                    }} 
                  />
                  <button type="button" onClick={() => {
                    if (newProvince && !form.supported_provinces.includes(newProvince)) {
                      setForm({ ...form, supported_provinces: [...form.supported_provinces, newProvince] });
                      setNewProvince('');
                    }
                  }}>Thêm</button>
                </div>
                <div className="province-list">
                  {form.supported_provinces.map(p => (
                    <span key={p}>
                      {p}
                      <button type="button" onClick={() => setForm({ ...form, supported_provinces: form.supported_provinces.filter(x => x !== p) })}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, unit: null, mode: 'create' })}>Hủy</button>
                <button type="submit" className="btn-primary">{modal.mode === 'edit' ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detail */}
      {modal.open && modal.mode === 'view' && modal.unit && (
        <ViewDetailModal unit={modal.unit} onClose={() => setModal({ open: false, unit: null, mode: 'create' })} />
      )}
    </div>
  );
};

export default ShopShippingUnitManager;