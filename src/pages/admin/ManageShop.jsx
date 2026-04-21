// src/pages/admin/shops/ShopsManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Save, AlertCircle, CheckCircle, Store, MapPin, Link as LinkIcon,
  Upload, Image, Trash
} from 'lucide-react';
import { adminApi } from '../../api/api';
import locationApi from '../../api/locationApi';
import '../../css/AdminManageLayout.css';
import Toast from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ShopsManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalShops, setTotalShops] = useState(0);
  const [locations, setLocations] = useState([]);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchLocationTerm, setSearchLocationTerm] = useState('');
  const [locationDetails, setLocationDetails] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedShop, setSelectedShop] = useState(null);
  
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Toast states
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Image upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoUploadMethod, setLogoUploadMethod] = useState('url');
  const [bannerUploadMethod, setBannerUploadMethod] = useState('url');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    district: '',
    ward: '',
    logo_url: '',
    banner_url: '',
    status: 'active',
    is_verified: false,
    location_id: ''
  });

  const [createOwnerAccount, setCreateOwnerAccount] = useState(false);
  const [ownerFormData, setOwnerFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    gender: '',
    address: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch shops from API
  useEffect(() => {
    fetchShops();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.get('/api/v1/admin/shops');
      console.log('Shops data:', response.data);
      setShops(response.data);
      setTotalShops(response.data.length);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Không thể tải danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationById = async (locationId) => {
    if (!locationId) return null;
    try {
      const response = await locationApi.getLocation(locationId);
      console.log('Location details:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await locationApi.getAllLocations(200);
      console.log('Fetched locations:', response.data);
      const locationsData = response.data?.data || response.data || [];
      setLocations(locationsData);
    } catch (error) {
      console.error('Error fetching locations:', error);
      showToast('Không thể tải danh sách địa điểm', 'error');
    } finally {
      setLoadingLocations(false);
    }
  };

  // ==================== UPLOAD IMAGE FUNCTIONS ====================
  
  const uploadImageToR2 = async (file) => {
    if (!file) return null;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await adminApi.post('/api/v1/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        return response.data.image_url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      if (error.response?.data?.detail) {
        showToast(`Lỗi upload: ${error.response.data.detail}`, 'error');
      } else {
        showToast('Có lỗi xảy ra khi upload ảnh', 'error');
      }
      return null;
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 5MB', 'error');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUrlInput('');
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 5MB', 'error');
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setBannerUrlInput('');
    setFormData(prev => ({ ...prev, banner_url: '' }));
  };

  const handleLogoUrlChange = (e) => {
    const url = e.target.value;
    setLogoUrlInput(url);
    setLogoPreview(url);
    setLogoFile(null);
    setFormData(prev => ({ ...prev, logo_url: url }));
  };

  const handleBannerUrlChange = (e) => {
    const url = e.target.value;
    setBannerUrlInput(url);
    setBannerPreview(url);
    setBannerFile(null);
    setFormData(prev => ({ ...prev, banner_url: url }));
  };

  const resetLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setLogoUrlInput('');
    setLogoUploadMethod('url');
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  const resetBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
    setBannerUrlInput('');
    setBannerUploadMethod('url');
    setFormData(prev => ({ ...prev, banner_url: '' }));
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      address: location.address || prev.address,
      province: location.province_name || prev.province,
      district: location.district || prev.district,
      ward: location.ward || prev.ward,
      location_id: location._id || location.id
    }));
    setShowLocationSelector(false);
    showToast(`Đã chọn địa điểm: ${location.name}`, 'success');
  };

  const filteredLocations = locations.filter(location => {
    if (!searchLocationTerm) return true;
    const searchLower = searchLocationTerm.toLowerCase();
    return (
      (location.name || '').toLowerCase().includes(searchLower) ||
      (location.address || '').toLowerCase().includes(searchLower) ||
      (location.province_name || '').toLowerCase().includes(searchLower)
    );
  });

  const handleOwnerInputChange = (e) => {
    const { name, value } = e.target;
    setOwnerFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[`owner_${name}`]) {
      setFormErrors(prev => ({ ...prev, [`owner_${name}`]: '' }));
    }
  };

  const filteredShops = shops.filter(shop => {
    if (!shop) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = shop.name?.toLowerCase() || '';
    const phone = shop.phone?.toString() || '';
    const email = shop.email?.toLowerCase() || '';
    const address = shop.address?.toLowerCase() || '';
    return (
      name.includes(searchLower) ||
      phone.includes(searchTerm) ||
      email.includes(searchLower) ||
      address.includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShops = filteredShops.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'name' && modalMode === 'add') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Tên cửa hàng không được để trống';
    if (!formData.slug) errors.slug = 'Slug không được để trống';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (createOwnerAccount) {
      if (!ownerFormData.username) errors.owner_username = 'Tên đăng nhập không được để trống';
      if (!ownerFormData.email) errors.owner_email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(ownerFormData.email)) {
        errors.owner_email = 'Email không hợp lệ';
      }
      if (!ownerFormData.password) errors.owner_password = 'Mật khẩu không được để trống';
      else if (ownerFormData.password.length < 6) {
        errors.owner_password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }
    return errors;
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // Upload logo if exists
      let uploadedLogoUrl = null;
      if (logoFile) {
        uploadedLogoUrl = await uploadImageToR2(logoFile);
        if (!uploadedLogoUrl) {
          setSubmitting(false);
          return;
        }
      }

      // Upload banner if exists
      let uploadedBannerUrl = null;
      if (bannerFile) {
        uploadedBannerUrl = await uploadImageToR2(bannerFile);
        if (!uploadedBannerUrl) {
          setSubmitting(false);
          return;
        }
      }

      const finalLogoUrl = uploadedLogoUrl || formData.logo_url || null;
      const finalBannerUrl = uploadedBannerUrl || formData.banner_url || null;

      const combinedData = {
        shop_name: formData.name,
        shop_slug: formData.slug,
        shop_description: formData.description,
        shop_phone: formData.phone,
        shop_email: formData.email,
        shop_address: formData.address,
        shop_province: formData.province,
        shop_district: formData.district,
        shop_ward: formData.ward,
        shop_logo_url: finalLogoUrl,
        shop_banner_url: finalBannerUrl,
        location_id: formData.location_id,
        
        owner_username: ownerFormData.username,
        owner_email: ownerFormData.email,
        owner_password: ownerFormData.password,
        owner_full_name: ownerFormData.full_name,
        owner_phone: ownerFormData.phone,
        owner_gender: ownerFormData.gender,
        owner_address: ownerFormData.address || formData.address
      };
      
      console.log('Sending combined data:', combinedData);
      const response = await adminApi.post('/api/v1/shops/with-owner', combinedData);
      
      if (response.data) {
        let message = 'Thêm cửa hàng thành công!';
        if (response.data.data && response.data.data.login_info) {
          const { login_info } = response.data.data;
          message = `Tạo cửa hàng và tài khoản thành công! Tên đăng nhập: ${login_info.username}, Mật khẩu: ${login_info.password}`;
        }
        showToast(message, 'success');
        setShowModal(false);
        resetForm();
        setOwnerFormData({
          username: '', email: '', password: '', 
          full_name: '', phone: '', gender: '', address: ''
        });
        setCreateOwnerAccount(false);
        setSelectedLocation(null);
        resetLogo();
        resetBanner();
        fetchShops();
      }
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Có lỗi xảy ra khi thêm cửa hàng';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // Upload logo if exists
      let uploadedLogoUrl = null;
      if (logoFile) {
        uploadedLogoUrl = await uploadImageToR2(logoFile);
      }

      // Upload banner if exists
      let uploadedBannerUrl = null;
      if (bannerFile) {
        uploadedBannerUrl = await uploadImageToR2(bannerFile);
      }

      const finalLogoUrl = uploadedLogoUrl || formData.logo_url || null;
      const finalBannerUrl = uploadedBannerUrl || formData.banner_url || null;

      const response = await adminApi.put(`/api/v1/admin/shops/${selectedShop._id}`, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
        status: formData.status,
        is_verified: formData.is_verified,
        location_id: formData.location_id
      });
      
      if (response.data) {
        showToast('Cập nhật cửa hàng thành công!', 'success');
        setShowModal(false);
        resetForm();
        resetLogo();
        resetBanner();
        fetchShops();
      }
    } catch (err) {
      console.error('Error updating shop:', err);
      showToast(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShop = (shopId) => {
    setDialogConfig({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa cửa hàng này? Hành động này không thể hoàn tác.',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await adminApi.delete(`/api/v1/admin/shops/${shopId}`);
          if (response.data) {
            showToast('Xóa cửa hàng thành công!', 'success');
            fetchShops();
          }
        } catch (err) {
          console.error('Error deleting shop:', err);
          showToast(err.response?.data?.detail || 'Có lỗi xảy ra khi xóa', 'error');
        }
      }
    });
    setShowConfirmDialog(true);
  };
  
  const openModal = async (mode, shop = null) => {
    setModalMode(mode);
    setSelectedLocation(null);
    setLocationDetails(null);
    resetLogo();
    resetBanner();
    
    if (shop) {
      setSelectedShop(shop);
      setFormData({
        name: shop.name || '',
        slug: shop.slug || '',
        description: shop.description || '',
        phone: shop.phone || '',
        email: shop.email || '',
        address: shop.address || '',
        province: shop.province || '',
        district: shop.district || '',
        ward: shop.ward || '',
        logo_url: shop.logo_url || '',
        banner_url: shop.banner_url || '',
        status: shop.status || 'active',
        is_verified: shop.is_verified || false,
        location_id: shop.location_id || ''
      });
      
      // Set previews for existing images
      if (shop.logo_url) {
        setLogoPreview(shop.logo_url);
        setLogoUrlInput(shop.logo_url);
      }
      if (shop.banner_url) {
        setBannerPreview(shop.banner_url);
        setBannerUrlInput(shop.banner_url);
      }
      
      if (shop.location_id) {
        const location = await fetchLocationById(shop.location_id);
        if (location) {
          setLocationDetails(location);
          setSelectedLocation(location);
        }
      }
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      province: '',
      district: '',
      ward: '',
      logo_url: '',
      banner_url: '',
      status: 'active',
      is_verified: false,
      location_id: ''
    });
    setFormErrors({});
    setSelectedShop(null);
    setSelectedLocation(null);
    setLocationDetails(null);
  };

  const handleExportExcel = () => {
    const headers = ['Thứ tự', 'Tên cửa hàng', 'Số điện thoại', 'Địa chỉ', 'Link trang', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...filteredShops.map((shop, index) => [
        index + 1,
        shop.name,
        shop.phone || '',
        shop.address || '',
        `/shop/${shop.slug}`,
        shop.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'danh_sach_cua_hang.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Xuất file Excel thành công!', 'success');
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'status-badge active' : 'status-badge inactive';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động';
  };

  // Component upload ảnh
  const ImageUploadSection = ({ label, preview, onFileSelect, onUrlChange, urlValue, uploadMethod, setUploadMethod, onReset, isViewMode }) => (
    <div className="form-group full-width">
      <label>{label}</label>
      
      {!isViewMode && (
        <div className="image-method-selector" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            type="button"
            className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
            onClick={() => setUploadMethod('url')}
            style={{
              padding: '8px 16px',
              background: uploadMethod === 'url' ? '#1976d2' : '#e0e0e0',
              color: uploadMethod === 'url' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <LinkIcon size={16} style={{ marginRight: '5px' }} /> Nhập URL
          </button>
          <button
            type="button"
            className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
            onClick={() => setUploadMethod('file')}
            style={{
              padding: '8px 16px',
              background: uploadMethod === 'file' ? '#1976d2' : '#e0e0e0',
              color: uploadMethod === 'file' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Upload size={16} style={{ marginRight: '5px' }} /> Tải lên từ máy
          </button>
        </div>
      )}

      {uploadMethod === 'url' ? (
        <div className="image-url-input">
          <input
            type="text"
            placeholder={`Nhập URL ${label.toLowerCase()}`}
            value={urlValue}
            onChange={onUrlChange}
            disabled={isViewMode}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
      ) : (
        !isViewMode && (
          <div className="image-upload-container">
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              style={{ display: 'none' }}
              id={`${label}-upload`}
            />
            <label htmlFor={`${label}-upload`} style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#4caf50',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              <Upload size={16} style={{ marginRight: '5px' }} /> Chọn ảnh từ máy
            </label>
          </div>
        )
      )}
      
      {preview && (
        <div className="image-preview" style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
          <img src={preview} alt={label} style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }} />
          {!isViewMode && (
            <button 
              type="button"
              onClick={onReset}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="users-management">
      {toast.show && (
        <div className="toast-container">
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
      />

      <div className="page-header">
        <h2 className="page-title">Quản Lý Cửa Hàng</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="actions-bar">
        <div className="users-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Nhập tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="users-search-input"
          />
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => openModal('add')}>
            <Plus size={18} />
            <span>Thêm cửa hàng</span>
          </button>
          <button className="btn btn-success" onClick={handleExportExcel}>
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên Cửa Hàng</th>
                <th>Số Điện Thoại</th>
                <th>Địa chỉ</th>
                <th>Link trang</th>
                <th>Trạng thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {currentShops.length > 0 ? (
                currentShops.map((shop, index) => (
                  <tr key={shop._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className="user-info-cell">
                        {shop.logo_url ? (
                          <img src={shop.logo_url} alt={shop.name} className="user-avatar-small" />
                        ) : (
                          <div className="user-avatar-small default">
                            <Store size={18} />
                          </div>
                        )}
                        <div>
                          <div className="user-name">{shop.name}</div>
                          <div className="user-username">SLUG: {shop.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{shop.phone || '—'}</td>
                    <td>
                      {shop.address ? (
                        <div className="user-username">
                          <MapPin size={12} style={{ marginRight: '4px' }} />
                          {shop.address}
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {shop.slug ? (
                        <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="user-username">
                          <LinkIcon size={12} style={{ marginRight: '4px' }} />
                          /shop/{shop.slug}
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={getStatusBadge(shop.status)}>
                        {getStatusText(shop.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="action-btn view" onClick={() => openModal('view', shop)} title="Xem chi tiết">
                          <Eye size={16} />
                        </button>
                        <button className="action-btn edit" onClick={() => openModal('edit', shop)} title="Sửa">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteShop(shop._id)} title="Xóa cửa hàng">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredShops.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredShops.length)} / {filteredShops.length} cửa hàng
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft size={16} />
            </button>
            <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button key={i} className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`} onClick={() => setCurrentPage(pageNum)}>
                  {pageNum}
                </button>
              );
            })}
            <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              <ChevronRight size={16} />
            </button>
            <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight size={16} />
            </button>
          </div>
          <div className="pagination-items-per-page">
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="items-per-page-select">
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'add' ? 'Thêm cửa hàng mới' : 
                 modalMode === 'edit' ? 'Sửa thông tin cửa hàng' : 
                 'Chi tiết cửa hàng'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleAddShop : handleUpdateShop}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-grid">
                  {/* Tên cửa hàng */}
                  <div className="form-group">
                    <label htmlFor="name">Tên cửa hàng *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={modalMode === 'view'} className={formErrors.name ? 'error' : ''} />
                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                  </div>

                  {/* Slug */}
                  <div className="form-group">
                    <label htmlFor="slug">Slug (URL) *</label>
                    <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleInputChange} disabled={modalMode === 'view'} className={formErrors.slug ? 'error' : ''} placeholder="ten-cua-hang" />
                    {formErrors.slug && <span className="error-message">{formErrors.slug}</span>}
                  </div>

                  {/* Số điện thoại */}
                  <div className="form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled={modalMode === 'view'} />
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={modalMode === 'view'} className={formErrors.email ? 'error' : ''} />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>

                  {/* Logo URL - Upload Section */}
                  <ImageUploadSection
                    label="Logo cửa hàng"
                    preview={logoPreview}
                    onFileSelect={handleLogoSelect}
                    onUrlChange={handleLogoUrlChange}
                    urlValue={logoUrlInput}
                    uploadMethod={logoUploadMethod}
                    setUploadMethod={setLogoUploadMethod}
                    onReset={resetLogo}
                    isViewMode={modalMode === 'view'}
                  />

                  {/* Banner URL - Upload Section */}
                  <ImageUploadSection
                    label="Banner cửa hàng"
                    preview={bannerPreview}
                    onFileSelect={handleBannerSelect}
                    onUrlChange={handleBannerUrlChange}
                    urlValue={bannerUrlInput}
                    uploadMethod={bannerUploadMethod}
                    setUploadMethod={setBannerUploadMethod}
                    onReset={resetBanner}
                    isViewMode={modalMode === 'view'}
                  />

                  {/* Địa chỉ */}
                  <div className="form-group full-width">
                    <label htmlFor="address">Địa chỉ</label>
                    <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} disabled={modalMode === 'view'} rows="2" />
                  </div>

                  {/* Tỉnh/Thành */}
                  <div className="form-group">
                    <label htmlFor="province">Tỉnh/Thành phố</label>
                    <input type="text" id="province" name="province" value={formData.province} onChange={handleInputChange} disabled={modalMode === 'view'} />
                  </div>

                  {/* Quận/Huyện */}
                  <div className="form-group">
                    <label htmlFor="district">Quận/Huyện</label>
                    <input type="text" id="district" name="district" value={formData.district} onChange={handleInputChange} disabled={modalMode === 'view'} />
                  </div>

                  {/* Phường/Xã */}
                  <div className="form-group">
                    <label htmlFor="ward">Phường/Xã</label>
                    <input type="text" id="ward" name="ward" value={formData.ward} onChange={handleInputChange} disabled={modalMode === 'view'} />
                  </div>

                  {/* Mô tả */}
                  <div className="form-group full-width">
                    <label htmlFor="description">Mô tả</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} disabled={modalMode === 'view'} rows="3" />
                  </div>

                  {/* Trạng thái */}
                  {modalMode !== 'add' && (
                    <div className="form-group">
                      <label htmlFor="status">Trạng thái</label>
                      <select id="status" name="status" value={formData.status} onChange={handleInputChange} disabled={modalMode === 'view'}>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Ngừng hoạt động</option>
                      </select>
                    </div>
                  )}

                  {/* ✅ PHẦN HIỂN THỊ VỊ TRÍ */}
                  <div className="form-group full-width" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} />
                      Vị trí cửa hàng
                    </label>
                    
                    {/* Hiển thị khi đã chọn location */}
                    {(selectedLocation || locationDetails) && (
                      <div style={{ 
                        padding: '12px', 
                        background: modalMode === 'view' ? '#f5f5f5' : '#e8f5e9', 
                        borderRadius: '8px', 
                        border: `1px solid ${modalMode === 'view' ? '#ddd' : '#4caf50'}`,
                        marginBottom: '10px'
                      }}>
                        <div><strong>{selectedLocation?.name || locationDetails?.name}</strong></div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                          📍 {selectedLocation?.address || locationDetails?.address}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '3px' }}>
                          🗺️ {selectedLocation?.lat || locationDetails?.lat}, {selectedLocation?.lng || locationDetails?.lng}
                        </div>
                        {modalMode !== 'view' && (
                          <button 
                            type="button" 
                            onClick={() => { setSelectedLocation(null); setLocationDetails(null); setFormData(prev => ({ ...prev, location_id: '' })); }} 
                            style={{ marginTop: '8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Bỏ chọn
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Nút chọn location - chỉ hiển thị khi chưa chọn và không phải chế độ view */}
                    {!selectedLocation && !locationDetails && modalMode !== 'view' && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          onClick={() => { fetchLocations(); setShowLocationSelector(true); }} 
                          style={{ padding: '10px 16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <MapPin size={16} /> Chọn từ danh sách địa điểm
                        </button>
                        <span style={{ fontSize: '12px', color: '#999' }}>Hoặc nhập thủ công bên trên</span>
                      </div>
                    )}
                    
                    {/* Hiển thị khi chưa chọn location ở chế độ view */}
                    {!selectedLocation && !locationDetails && modalMode === 'view' && (
                      <div style={{ padding: '12px', background: '#fff3e0', borderRadius: '8px', color: '#e65100' }}>
                        <MapPin size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Chưa có thông tin vị trí
                      </div>
                    )}
                    
                    {/* Hiển thị location_id nếu có */}
                    {formData.location_id && !selectedLocation && !locationDetails && (
                      <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '5px' }}>
                        ✓ Đã liên kết với địa điểm ID: {formData.location_id}
                      </div>
                    )}
                  </div>

                  {modalMode === 'add' && (
                    <div className="owner-section" style={{ marginTop: '20px', borderTop: '2px dashed #1976d2', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#e3f2fd', padding: '10px 15px', borderRadius: '8px' }}>
                        <input type="checkbox" id="createOwner" checked={createOwnerAccount} onChange={(e) => setCreateOwnerAccount(e.target.checked)} style={{ width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer' }} />
                        <label htmlFor="createOwner" style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '16px', cursor: 'pointer' }}>Tạo tài khoản chủ shop mới (Khuyến nghị)</label>
                      </div>
                      
                      {createOwnerAccount && (
                        <div className="owner-form" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
                          <h4 style={{ marginBottom: '20px', color: '#333' }}>Thông tin tài khoản chủ shop</h4>
                          <div className="form-grid">
                            <div className="form-group"><label>Tên đăng nhập *</label><input type="text" name="username" value={ownerFormData.username} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'} /></div>
                            <div className="form-group"><label>Email *</label><input type="email" name="email" value={ownerFormData.email} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'} /></div>
                            <div className="form-group"><label>Mật khẩu *</label><input type="password" name="password" value={ownerFormData.password} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'} placeholder="Ít nhất 6 ký tự" /></div>
                            <div className="form-group"><label>Họ và tên</label><input type="text" name="full_name" value={ownerFormData.full_name} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'} /></div>
                            <div className="form-group"><label>Số điện thoại</label><input type="tel" name="phone" value={ownerFormData.phone} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'} /></div>
                            <div className="form-group"><label>Giới tính</label><select name="gender" value={ownerFormData.gender} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'}><option value="">Chọn</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></div>
                            <div className="form-group full-width"><label>Địa chỉ</label><textarea name="address" value={ownerFormData.address} onChange={handleOwnerInputChange} disabled={modalMode !== 'add'} rows="2" /></div>
                          </div>
                        </div>
                      )}
                      
                      {!createOwnerAccount && (
                        <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AlertCircle size={20} color="#e65100" />
                          <span style={{ color: '#e65100' }}>Bạn cần tạo tài khoản chủ shop để có thể đăng nhập vào cửa hàng này!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                {modalMode !== 'view' && (
                  <button type="submit" className="btn btn-primary" disabled={submitting || uploadingLogo || uploadingBanner}>
                    <Save size={18} />
                    <span>{submitting ? 'Đang lưu...' : 'Lưu'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chọn địa điểm */}
      {showLocationSelector && (
        <div className="modal-overlay" onClick={() => setShowLocationSelector(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><MapPin size={18} style={{ marginRight: '8px' }} />Chọn vị trí cửa hàng</h3>
              <button className="modal-close" onClick={() => setShowLocationSelector(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '15px' }}>
                <div className="users-search-box" style={{ width: '100%' }}>
                  <Search size={18} className="search-icon" />
                  <input type="text" placeholder="Tìm kiếm địa điểm..." value={searchLocationTerm} onChange={(e) => setSearchLocationTerm(e.target.value)} className="users-search-input" style={{ width: '100%' }} />
                </div>
              </div>
              
              {loadingLocations ? (
                <div className="loading-spinner" style={{ padding: '40px' }}><div className="spinner"></div><p>Đang tải...</p></div>
              ) : filteredLocations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}><MapPin size={48} /><p>Không tìm thấy địa điểm nào</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredLocations.map(location => (
                    <div key={location._id || location.id} onClick={() => handleSelectLocation(location)} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div><strong>{location.name}</strong></div>
                      <div style={{ fontSize: '13px', color: '#666' }}>📍 {location.address}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>🗺️ {location.lat}, {location.lng}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowLocationSelector(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopsManagement;