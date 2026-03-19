// src/pages/shop/ShopProducts.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaBox,
  FaTag,
  FaCalendarAlt,
  FaSpinner,
  FaTimes,
  FaSave,
  FaUpload,
  FaImage,
  FaQrcode,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaFilter,
  FaPlusCircle,
  FaMinusCircle
} from 'react-icons/fa';
import shopApi from '../../api/api';
import '../../css/ShopProducts.css';

const ShopProducts = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    origin: '',
    certification: '',
    price: '',
    stock: '',
    image_url: ''
  });
  
  // Variants state
  const [variants, setVariants] = useState([]);
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, debouncedSearch, selectedCategory, selectedStatus]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await shopApi.get('/api/v1/shop/products', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          category_id: selectedCategory || undefined,
          status: selectedStatus || undefined
        }
      });
      
      setProducts(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await shopApi.get('/api/v1/categories');
      
      // Chuẩn hóa: tạo trường 'id' từ '_id'
      const normalizedCategories = (response.data || []).map(cat => ({
        ...cat,
        id: cat._id
      }));
      
      setCategories(normalizedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle variant change
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  // Add new variant
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: '',
        price: '',
        stock: '',
        sku: ''
      }
    ]);
  };

  // Remove variant
  const removeVariant = (index) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload image
  const uploadImage = async (productId) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      setUploading(true);
      const response = await shopApi.post(`/api/v1/shop/products/${productId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async () => {
    // Validate
    if (!formData.name || !formData.category_id) {
      alert('Vui lòng nhập tên sản phẩm và chọn danh mục');
      return;
    }

    // Kiểm tra variants
    if (variants.length === 0 && !formData.price) {
      alert('Vui lòng nhập giá sản phẩm hoặc thêm biến thể');
      return;
    }

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.name || !v.price) {
        alert(`Biến thể thứ ${i + 1} thiếu tên hoặc giá`);
        return;
      }
    }

    // Kiểm tra category hợp lệ
    const selectedCat = categories.find(c => c.id === formData.category_id);
    if (!selectedCat) {
      alert('Vui lòng chọn danh mục hợp lệ');
      return;
    }

     try {
    setSaving(true);
    
    // Chuẩn bị dữ liệu gửi lên
    const productData = {
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id,
      origin: formData.origin,
      certification: formData.certification,
      image_url: null, // Sẽ upload sau
      variants: variants.map(v => ({
        name: v.name,
        price: parseFloat(v.price),
        stock: parseInt(v.stock) || 0,
        sku: v.sku || null
      }))
    };

    // Nếu không có variants, thêm price và stock
    if (variants.length === 0) {
      productData.price = parseFloat(formData.price);
      productData.stock = parseInt(formData.stock) || 0;
    }

    console.log('Sending product data:', JSON.stringify(productData, null, 2));
    
    // Tạo sản phẩm
    const response = await shopApi.post('/api/v1/shop/products', productData);
    console.log('Product created:', response.data);

    // Upload ảnh nếu có
    if (imageFile) {
      await uploadImage(response.data.id);
    }

    // Refresh danh sách
    fetchProducts();
    
    setShowAddModal(false);
    resetForm();
    alert('Thêm sản phẩm thành công!');
  } catch (error) {
    console.error('Error adding product:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
      alert(`Lỗi: ${JSON.stringify(error.response.data.detail) || 'Có lỗi xảy ra'}`);
    } else {
      alert('Có lỗi xảy ra khi thêm sản phẩm');
    }
  } finally {
    setSaving(false);
  }
};

  // Edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      origin: product.origin || '',
      certification: product.certification || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || ''
    });
    setVariants(product.variants || []);
    setImagePreview(product.image_url || '');
    setShowEditModal(true);
  };

  // Update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      
      await shopApi.put(`/api/v1/shop/products/${selectedProduct.id}`, {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        origin: formData.origin,
        certification: formData.certification,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });

      // Upload ảnh mới nếu có
      if (imageFile) {
        await uploadImage(selectedProduct.id);
      }

      fetchProducts();
      setShowEditModal(false);
      resetForm();
      alert('Cập nhật sản phẩm thành công!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Có lỗi xảy ra khi cập nhật sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  // View product detail
  const handleViewProduct = async (product) => {
    try {
      const response = await shopApi.get(`/api/v1/shop/products/${product.id}`);
      setSelectedProduct(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching product detail:', error);
      alert('Không thể tải chi tiết sản phẩm');
    }
  };

  // Delete product
  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      await shopApi.delete(`/api/v1/shop/products/${selectedProduct.id}`);
      fetchProducts();
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      alert('Xóa sản phẩm thành công!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      origin: '',
      certification: '',
      price: '',
      stock: '',
      image_url: ''
    });
    setVariants([]);
    setImageFile(null);
    setImagePreview('');
    setSelectedProduct(null);
  };

  // Format functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="shop-products">
      {/* Header */}
      <div className="products-header">
        <h1 className="products-title">Quản Lý Sản Phẩm</h1>
        
        <div className="products-actions">
          <button 
            className="add-btn"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FaPlus /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="products-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Lọc
        </button>

        {(selectedCategory || selectedStatus || searchTerm) && (
          <button className="clear-filters" onClick={clearFilters}>
            <FaTimes /> Xóa lọc
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Danh mục</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Trạng thái</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="in_stock">Còn hàng</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="products-table-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên Sản Phẩm</th>
                <th>Ngày tạo</th>
                <th>Số Lượng</th>
                <th>Đơn Giá</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={product.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <div className="product-name">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="product-thumb" />
                        ) : (
                          <div className="product-thumb-placeholder">
                            <FaBox />
                          </div>
                        )}
                        <div>
                          <span className="product-title">{product.name}</span>
                          {product.variants_count > 0 && (
                            <span className="variant-badge">{product.variants_count} biến thể</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <FaCalendarAlt className="date-icon" />
                        {formatDate(product.created_at)}
                      </div>
                    </td>
                    <td>
                      <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                        {product.stock > 0 ? product.stock.toLocaleString() : 'Đã hết'}
                      </span>
                    </td>
                    <td className="price-cell">{formatCurrency(product.price)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewProduct(product)}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditProduct(product)}
                          title="Sửa"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteProduct(product)}
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Trang hiển thị {pagination.page}/{pagination.total_pages}
          </div>
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              <FaAngleDoubleLeft />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <FaChevronLeft />
            </button>
            
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum;
              if (pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={`page-${pageNum}`}
                  className={pagination.page === pageNum ? 'active' : ''}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
            >
              <FaChevronRight />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.total_pages)}
              disabled={pagination.page === pagination.total_pages}
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content product-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm sản phẩm mới</h2>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên sản phẩm <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                <div className="form-group">
                  <label>Danh mục <span className="required">*</span></label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Nếu không có variants, hiển thị price và stock */}
                {variants.length === 0 && (
                  <>
                    <div className="form-group">
                      <label>Đơn giá <span className="required">*</span></label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Nhập đơn giá"
                      />
                    </div>

                    <div className="form-group">
                      <label>Số lượng</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="Nhập số lượng"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Xuất xứ</label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    placeholder="Nhập xuất xứ"
                  />
                </div>

                <div className="form-group">
                  <label>Chứng nhận</label>
                  <input
                    type="text"
                    name="certification"
                    value={formData.certification}
                    onChange={handleInputChange}
                    placeholder="Nhập chứng nhận"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Nhập mô tả sản phẩm"
                  />
                </div>

                {/* Variants Section */}
                <div className="form-group full-width">
                  <div className="variants-header">
                    <label>Biến thể sản phẩm</label>
                    <button type="button" className="add-variant-btn" onClick={addVariant}>
                      <FaPlusCircle /> Thêm biến thể
                    </button>
                  </div>

                  {variants.map((variant, index) => (
                    <div key={index} className="variant-item">
                      <div className="variant-row">
                        <input
                          type="text"
                          placeholder="Tên biến thể (VD: Size M)"
                          value={variant.name}
                          onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Giá"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Số lượng"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="SKU (Mã sản phẩm)"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        />
                        <button 
                          type="button" 
                          className="remove-variant-btn"
                          onClick={() => removeVariant(index)}
                        >
                          <FaMinusCircle />
                        </button>
                      </div>
                    </div>
                  ))}

                  {variants.length > 0 && (
                    <p className="variants-note">
                      <FaTag /> Tổng số lượng sẽ được tính tự động từ các biến thể
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Hình ảnh</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id="product-image"
                    />
                    <label htmlFor="product-image" className="image-upload-btn">
                      <FaUpload /> Chọn ảnh
                    </label>
                    
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                Hủy
              </button>
              <button 
                className="save-btn" 
                onClick={handleAddProduct}
                disabled={saving || uploading}
              >
                {saving || uploading ? <FaSpinner className="spinning" /> : <FaSave />}
                {saving ? 'Đang lưu...' : 'Thêm sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content product-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa sản phẩm</h2>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên sản phẩm <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                <div className="form-group">
                  <label>Danh mục <span className="required">*</span></label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Đơn giá <span className="required">*</span></label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Nhập đơn giá"
                  />
                </div>

                <div className="form-group">
                  <label>Số lượng</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="Nhập số lượng"
                  />
                </div>

                <div className="form-group">
                  <label>Xuất xứ</label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    placeholder="Nhập xuất xứ"
                  />
                </div>

                <div className="form-group">
                  <label>Chứng nhận</label>
                  <input
                    type="text"
                    name="certification"
                    value={formData.certification}
                    onChange={handleInputChange}
                    placeholder="Nhập chứng nhận"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Nhập mô tả sản phẩm"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Hình ảnh</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id="edit-product-image"
                    />
                    <label htmlFor="edit-product-image" className="image-upload-btn">
                      <FaUpload /> Chọn ảnh mới
                    </label>
                    
                    {(imagePreview || formData.image_url) && (
                      <div className="image-preview">
                        <img src={imagePreview || formData.image_url} alt="Preview" />
                        <button 
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}>
                Hủy
              </button>
              <button 
                className="save-btn" 
                onClick={handleUpdateProduct}
                disabled={saving || uploading}
              >
                {saving || uploading ? <FaSpinner className="spinning" /> : <FaSave />}
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết sản phẩm</h2>
              <button className="close-btn" onClick={() => {
                setShowDetailModal(false);
                setSelectedProduct(null);
              }}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="product-detail">
                <div className="detail-section">
                  <h3>Thông tin cơ bản</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Tên sản phẩm:</label>
                      <p>{selectedProduct.name}</p>
                    </div>
                    <div className="detail-item">
                      <label>Danh mục:</label>
                      <p>{selectedProduct.category?.name || 'Chưa có'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Đơn giá:</label>
                      <p className="price">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div className="detail-item">
                      <label>Số lượng:</label>
                      <p>
                        <span className={`stock-badge ${selectedProduct.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                          {selectedProduct.stock > 0 ? selectedProduct.stock.toLocaleString() : 'Hết hàng'}
                        </span>
                      </p>
                    </div>
                    <div className="detail-item">
                      <label>Xuất xứ:</label>
                      <p>{selectedProduct.origin || 'Chưa có'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Chứng nhận:</label>
                      <p>{selectedProduct.certification || 'Chưa có'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Ngày tạo:</label>
                      <p>{formatDate(selectedProduct.created_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="detail-section">
                    <h3>Mô tả sản phẩm</h3>
                    <p className="description">{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="detail-section">
                    <h3>Biến thể sản phẩm</h3>
                    <div className="variants-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Tên biến thể</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>SKU</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.variants.map(variant => (
                            <tr key={variant.id}>
                              <td>{variant.name}</td>
                              <td>{formatCurrency(variant.price)}</td>
                              <td>{variant.stock}</td>
                              <td>{variant.sku || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedProduct.image_url && (
                  <div className="detail-section">
                    <h3>Hình ảnh</h3>
                    <div className="product-image">
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} />
                    </div>
                  </div>
                )}

                {selectedProduct.qr_code_url && (
                  <div className="detail-section">
                    <h3>Mã QR truy xuất</h3>
                    <div className="qr-code">
                      <img src={selectedProduct.qr_code_url} alt="QR Code" />
                      <p>Quét mã để xem thông tin truy xuất nguồn gốc</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa sản phẩm <strong>{selectedProduct.name}</strong>?</p>
              <p className="warning-text">Hành động này không thể hoàn tác!</p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Hủy
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProducts;