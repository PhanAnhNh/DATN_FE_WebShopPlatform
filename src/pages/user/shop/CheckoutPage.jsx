import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { 
  FaTruck, FaMapMarkerAlt, FaPhone, FaUser, FaEdit, FaTag, 
  FaMoneyBillWave, FaUniversity, FaArrowLeft, FaCheckCircle, 
  FaSpinner, FaTrash, FaSave, FaTimes, FaHome, FaShoppingCart,
  FaMobileAlt, FaCreditCard
} from 'react-icons/fa';
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVouchers, setShowVouchers] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [note, setNote] = useState("");
  const [shippingAddress, setShippingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [editAddress, setEditAddress] = useState({
    name: "", phone: "", street: "", ward: "", district: "", city: "", country: "Việt Nam"
  });
  const [currentShopId, setCurrentShopId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  useEffect(() => {
    loadCheckoutData();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (selectedItems.length > 0) {
      const shopId = selectedItems[0]?.shop_id;
      if (shopId) {
        setCurrentShopId(shopId);
        fetchAvailableVouchers(shopId);
        fetchShopSettings(shopId);
      }
    }
  }, [selectedItems]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      const user = response.data;
      
      let street = "", ward = "", district = "", city = "";
      if (user.address) {
        const parts = user.address.split(',');
        if (parts.length >= 1) street = parts[0].trim();
        if (parts.length >= 2) ward = parts[1].trim();
        if (parts.length >= 3) district = parts[2].trim();
        if (parts.length >= 4) city = parts[3].trim();
      }
      
      const address = {
        name: user.full_name || user.username,
        phone: user.phone || "",
        street, ward, district, city,
        country: "Việt Nam"
      };
      setShippingAddress(address);
      setEditAddress(address);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchShopSettings = async (shopId) => {
    try {
      const response = await api.get(`/api/v1/shop/settings/public/${shopId}`);
      const settings = response.data;
      
      const methods = [];
      
      if (settings.payment?.cod === true) {
        methods.push({ id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: <FaMoneyBillWave />, description: 'Thanh toán bằng tiền mặt khi nhận hàng' });
      }
      
      if (settings.payment?.bank_transfer === true && settings.payment?.bank_accounts?.length > 0) {
        methods.push({ id: 'bank', name: 'Chuyển khoản ngân hàng', icon: <FaUniversity />, description: 'Chuyển khoản qua QR code' });
      }
      
      if (settings.payment?.momo === true) {
        methods.push({ id: 'momo', name: 'Ví MoMo', icon: <FaMobileAlt />, description: 'Thanh toán qua ví MoMo' });
      }
      
      if (settings.payment?.vnpay === true) {
        methods.push({ id: 'vnpay', name: 'VNPay', icon: <FaCreditCard />, description: 'Thanh toán qua cổng VNPay' });
      }
      
      if (methods.length === 0) {
        methods.push(
          { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: <FaMoneyBillWave /> },
          { id: 'bank', name: 'Chuyển khoản ngân hàng', icon: <FaUniversity /> }
        );
      }
      
      setPaymentMethods(methods);
      if (methods.length > 0 && !methods.find(m => m.id === paymentMethod)) {
        setPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error);
      setPaymentMethods([
        { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: <FaMoneyBillWave /> },
        { id: 'bank', name: 'Chuyển khoản ngân hàng', icon: <FaUniversity /> }
      ]);
    }
  };

  const fetchAvailableVouchers = async (shopId) => {
    setVoucherLoading(true);
    try {
      const response = await api.get('/api/v1/vouchers/available', {
        params: { shop_id: shopId, order_total: getSelectedTotal() }
      });
      setAvailableVouchers(response.data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setVoucherLoading(false);
    }
  };

  const loadCheckoutData = () => {
    const items = localStorage.getItem('selectedCartItems');
    if (items) {
      try {
        const parsedItems = JSON.parse(items);
        setSelectedItems(parsedItems);
        if (parsedItems.length > 0 && parsedItems[0].shop_id) {
          setCurrentShopId(parsedItems[0].shop_id);
        }
      } catch (error) {
        console.error("Error parsing selected items:", error);
      }
    }
    
    const voucher = localStorage.getItem('selectedVoucher');
    if (voucher && voucher !== 'null' && voucher !== 'undefined') {
      try {
        const parsedVoucher = JSON.parse(voucher);
        setSelectedVoucher(parsedVoucher);
        setVoucherCode(parsedVoucher.code || "");
      } catch (error) {
        console.error("Error parsing voucher:", error);
      }
    }
    
    setLoading(false);
  };

  const handleSaveAddress = () => {
    if (!editAddress.name.trim()) return showToast("Vui lòng nhập tên người nhận", "error");
    if (!editAddress.phone.trim()) return showToast("Vui lòng nhập số điện thoại", "error");
    if (!editAddress.street.trim()) return showToast("Vui lòng nhập số nhà và tên đường", "error");
    if (!editAddress.ward.trim()) return showToast("Vui lòng nhập phường/xã", "error");
    if (!editAddress.district.trim()) return showToast("Vui lòng nhập quận/huyện", "error");
    if (!editAddress.city.trim()) return showToast("Vui lòng nhập tỉnh/thành phố", "error");
    
    setShippingAddress({ ...editAddress });
    showToast("Cập nhật địa chỉ thành công!", "success");
    setShowAddressForm(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const getSelectedTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const selectedTotal = getSelectedTotal();
    if (!selectedVoucher) return 0;
    if (selectedVoucher.discount_type === "percent") {
      const discount = (selectedTotal * selectedVoucher.discount_value) / 100;
      return selectedVoucher.max_discount ? Math.min(discount, selectedVoucher.max_discount) : discount;
    }
    return selectedVoucher.discount_value;
  };

  const calculateShipping = () => {
    if (selectedVoucher?.code === "FREESHIP") return 0;
    return getSelectedTotal() >= 200000 ? 0 : 15000;
  };

  const finalTotal = getSelectedTotal() - calculateDiscount() + calculateShipping();

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return showToast("Vui lòng nhập mã giảm giá", "error");
    
    setApplyingVoucher(true);
    setVoucherError("");
    
    try {
      const params = { code: voucherCode.toUpperCase(), order_total: getSelectedTotal() };
      if (currentShopId) params.shop_id = currentShopId;
      
      const response = await api.post('/api/v1/vouchers/validate', null, { params });
      
      if (response.data?.discount !== undefined && response.data?.voucher) {
        setSelectedVoucher({
          ...response.data.voucher,
          discount: response.data.discount,
          id: response.data.voucher._id,
          _id: response.data.voucher._id
        });
        showToast(`Áp dụng mã ${voucherCode.toUpperCase()} thành công! Giảm ${formatCurrency(response.data.discount)}`, "success");
      } else if (response.data?.error) {
        setVoucherError(response.data.error);
        showToast(response.data.error, "error");
      }
    } catch (error) {
      const msg = error.response?.data?.error || "Mã giảm giá không hợp lệ";
      setVoucherError(msg);
      showToast(msg, "error");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
    showToast("Đã xóa mã giảm giá", "success");
  };

  // Sửa hàm handleSubmitOrder
  const handleSubmitOrder = async () => {
    if (!shippingAddress?.street) return showToast("Vui lòng cập nhật địa chỉ nhận hàng", "error");
    if (selectedItems.length === 0) return showToast("Không có sản phẩm nào để đặt hàng", "error");
    
    setSubmitting(true);
    try {
      const orderData = {
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          variant_id: item.variant_id || null,
          variant_name: item.variant_name || null,
          subtotal: item.subtotal || item.price * item.quantity,
          shop_id: item.shop_id
        })),
        total_amount: finalTotal,
        subtotal: getSelectedTotal(),
        discount: calculateDiscount(),
        shipping_fee: calculateShipping(),
        shipping_address: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          ward: shippingAddress.ward,
          district: shippingAddress.district,
          city: shippingAddress.city,
          country: shippingAddress.country,
          full_address: Object.values(shippingAddress).filter(v => v && v !== "Việt Nam").join(", ")
        },
        note: note || "",
        payment_method: paymentMethod,
        voucher: selectedVoucher ? {
          id: selectedVoucher._id,
          code: selectedVoucher.code,
          discount: calculateDiscount()
        } : null
      };
      
      const response = await api.post('/api/v1/orders', orderData);
      const order = response.data;
      const orderId = order.id || order._id;
      
      // Xóa localStorage
      localStorage.removeItem('selectedCartItems');
      localStorage.removeItem('selectedVoucher');
      
      setOrderSuccess({ orderId, totalAmount: finalTotal, paymentMethod });
      
      // Xử lý theo phương thức thanh toán
      if (paymentMethod === 'cod') {
        // COD: Hiển thị modal thành công ngay
        setShowSuccessModal(true);
        
        // Xóa sản phẩm khỏi giỏ hàng (background)
        for (const item of selectedItems) {
          try {
            await api.delete('/api/v1/cart/remove', {
              params: { product_id: item.product_id, variant_id: item.variant_id || null }
            });
          } catch (error) {
            console.error("Error removing item from cart:", error);
          }
        }
      } else if (paymentMethod === 'bank') {
        // Bank: Chuyển đến trang hướng dẫn thanh toán (đơn hàng đã được tạo với status = "pending_payment")
        navigate(`/payment/instructions/${orderId}`, {
          state: { shopId: selectedItems[0]?.shop_id, orderTotal: finalTotal }
        });
      } else {
        // Momo, VNPay, ZaloPay
        const paymentResponse = await api.post('/api/v1/payments/create', {
          order_id: orderId,
          method: paymentMethod,
          amount: finalTotal
        });
        
        if (paymentResponse.data?.payment_url) {
          window.location.href = paymentResponse.data.payment_url;
        } else {
          throw new Error('Không nhận được URL thanh toán');
        }
      }
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage = error.response?.data?.detail || "Có lỗi xảy ra, vui lòng thử lại!";
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccessModal = (navigateTo) => {
    setShowSuccessModal(false);
    if (navigateTo === 'order-detail') {
      navigate(`/orders/${orderSuccess?.orderId}`);
    } else if (navigateTo === 'shop') {
      navigate('/');
    }
  };

  const handleVoucherClick = async (voucher) => {
    try {
      const params = { code: voucher.code, order_total: getSelectedTotal() };
      if (currentShopId) params.shop_id = currentShopId;
      
      const response = await api.post('/api/v1/vouchers/validate', null, { params });
      
      if (response.data?.discount !== undefined) {
        setSelectedVoucher({
          ...voucher,
          discount: response.data.discount,
          id: voucher._id,
          _id: voucher._id
        });
        setVoucherCode(voucher.code);
        showToast(`Áp dụng mã ${voucher.code} thành công! Giảm ${formatCurrency(response.data.discount)}`, "success");
        setShowVouchers(false);
      }
    } catch (error) {
      showToast(error.response?.data?.error || "Không thể áp dụng voucher này", "error");
    }
  };

  if (loading) {
    return (
      <ShopDetailLayout>
        <div style={{ textAlign: "center", padding: "80px" }}>
          <FaSpinner className="spinning" size={40} color="#2e7d32" />
          <p>Đang tải thông tin...</p>
        </div>
      </ShopDetailLayout>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <ShopDetailLayout>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <FaShoppingCart size={80} color="#ccc" />
          <h2>Không có sản phẩm để thanh toán</h2>
          <button onClick={() => navigate('/cart')} style={{ padding: "12px 32px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", marginTop: "20px" }}>
            Quay lại giỏ hàng
          </button>
        </div>
      </ShopDetailLayout>
    );
  }

  return (
    <ShopDetailLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Toast */}
        {toast.show && (
          <div className="toast-overlay">
            <div className={`toast-content ${toast.type}`}>
              {toast.type === 'success' ? <FaCheckCircle size={24} /> : <FaTimes size={24} />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{ marginBottom: "24px" }}>
          <span onClick={() => navigate('/')} style={{ cursor: "pointer", color: "#2e7d32" }}>Trang chủ</span> ›
          <span onClick={() => navigate('/cart')} style={{ cursor: "pointer", color: "#2e7d32", marginLeft: "8px" }}>Giỏ hàng</span> ›
          <span style={{ marginLeft: "8px", color: "#333" }}>Thanh toán</span>
        </div>

        <h1 style={{ fontSize: "28px", marginBottom: "24px" }}>Thanh toán</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px" }}>
          {/* Left Column */}
          <div>
            {/* Địa chỉ nhận hàng */}
            <div className="checkout-section">
              <div className="section-header">
                <FaMapMarkerAlt color="#2e7d32" /> Địa Chỉ Nhận Hàng
                {!showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="edit-btn">
                    <FaEdit /> Thay Đổi
                  </button>
                )}
              </div>
              
              {!showAddressForm ? (
                <div className="address-display">
                  <div><FaUser /> {shippingAddress?.name} | <FaPhone /> {shippingAddress?.phone}</div>
                  <div><FaHome /> {shippingAddress?.street}, {shippingAddress?.ward}, {shippingAddress?.district}, {shippingAddress?.city}</div>
                </div>
              ) : (
                <div className="address-form">
                  <input type="text" placeholder="Họ và tên *" value={editAddress.name} onChange={(e) => setEditAddress({ ...editAddress, name: e.target.value })} />
                  <input type="tel" placeholder="Số điện thoại *" value={editAddress.phone} onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })} />
                  <input type="text" placeholder="Số nhà, tên đường *" value={editAddress.street} onChange={(e) => setEditAddress({ ...editAddress, street: e.target.value })} />
                  <input type="text" placeholder="Phường/Xã *" value={editAddress.ward} onChange={(e) => setEditAddress({ ...editAddress, ward: e.target.value })} />
                  <input type="text" placeholder="Quận/Huyện *" value={editAddress.district} onChange={(e) => setEditAddress({ ...editAddress, district: e.target.value })} />
                  <input type="text" placeholder="Tỉnh/Thành phố *" value={editAddress.city} onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })} />
                  <div className="form-buttons">
                    <button onClick={() => setShowAddressForm(false)} className="cancel-btn">Hủy</button>
                    <button onClick={handleSaveAddress} className="save-btn">Lưu</button>
                  </div>
                </div>
              )}
            </div>

            {/* Sản phẩm */}
            <div className="checkout-section">
              <h2><FaTruck /> Sản Phẩm</h2>
              {selectedItems.map((item, idx) => (
                <div key={idx} className="checkout-item">
                  <img src={item.image_url || "/placeholder.jpg"} alt={item.product_name} />
                  <div>
                    <div className="item-name">{item.product_name}</div>
                    {item.variant_name && <div className="item-variant">{item.variant_name}</div>}
                    <div className="item-quantity">x{item.quantity}</div>
                  </div>
                  <div className="item-price">{formatCurrency(item.price)}</div>
                </div>
              ))}
            </div>

            {/* Voucher */}
            <div className="checkout-section">
              <h2><FaTag /> Voucher</h2>
              <div className="voucher-input">
                <input type="text" placeholder="Nhập mã giảm giá" value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value); setVoucherError(""); if (selectedVoucher) setSelectedVoucher(null); }}
                  disabled={selectedVoucher !== null} />
                {selectedVoucher ? (
                  <button onClick={removeVoucher} className="remove-voucher-btn">Xóa</button>
                ) : (
                  <button onClick={applyVoucher} disabled={applyingVoucher} className="apply-voucher-btn">
                    {applyingVoucher ? <FaSpinner className="spinning" /> : "Áp dụng"}
                  </button>
                )}
              </div>
              
              {selectedVoucher && (
                <div className="applied-voucher">
                  Đã áp dụng mã {selectedVoucher.code} - Giảm {selectedVoucher.discount_type === "percent" ? `${selectedVoucher.discount_value}%` : formatCurrency(selectedVoucher.discount_value)}
                </div>
              )}
              
              <button onClick={() => setShowVouchers(!showVouchers)} className="show-vouchers-btn">
                Xem thêm voucher {showVouchers ? "▲" : "▼"}
              </button>
              
              {showVouchers && (
                <div className="voucher-list">
                  {voucherLoading ? <FaSpinner className="spinning" /> : availableVouchers.map(v => (
                    <div key={v._id} className={`voucher-item ${selectedVoucher?._id === v._id ? 'selected' : ''}`} onClick={() => handleVoucherClick(v)}>
                      <div className="voucher-code">{v.code}</div>
                      <div className="voucher-desc">
                        Giảm {v.discount_type === "percent" ? `${v.discount_value}%` : formatCurrency(v.discount_value)}
                        {v.min_order_value > 0 && ` cho đơn từ ${formatCurrency(v.min_order_value)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lời nhắn */}
            <div className="checkout-section">
              <h2>Lời nhắn</h2>
              <textarea placeholder="Lưu ý cho người bán..." value={note} onChange={(e) => setNote(e.target.value)} rows="3" />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="order-summary">
              <h2>Đơn hàng</h2>
              <div className="summary-row"><span>Tiền sản phẩm</span><span>{formatCurrency(getSelectedTotal())}</span></div>
              <div className="summary-row"><span>Phí vận chuyển</span><span>{formatCurrency(calculateShipping())}</span></div>
              {selectedVoucher && (
                <div className="summary-row discount"><span>Giảm giá ({selectedVoucher.code})</span><span>- {formatCurrency(calculateDiscount())}</span></div>
              )}
              <div className="summary-divider"></div>
              <div className="summary-row total"><span>Tổng tiền</span><span>{formatCurrency(finalTotal)}</span></div>

              {/* Payment Methods */}
              <div className="payment-methods">
                <h3>Phương thức thanh toán</h3>
                {paymentMethods.map(method => (
                  <label key={method.id} className={`payment-method ${paymentMethod === method.id ? 'active' : ''}`}>
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)} />
                    {method.icon}
                    <div>
                      <div className="method-name">{method.name}</div>
                      {method.description && <div className="method-desc">{method.description}</div>}
                    </div>
                    {paymentMethod === method.id && <FaCheckCircle color="#2e7d32" />}
                  </label>
                ))}
              </div>

              <button onClick={handleSubmitOrder} disabled={submitting} className="submit-order-btn">
                {submitting ? <FaSpinner className="spinning" /> : "Đặt hàng"}
              </button>
              
              <button onClick={() => navigate('/cart')} className="back-to-cart-btn">
                <FaArrowLeft /> Quay lại giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => handleCloseSuccessModal('stay')}>
          <div className="success-modal" onClick={e => e.stopPropagation()}>
            <div className="success-icon"><FaCheckCircle /></div>
            <h2>Đặt hàng thành công!</h2>
            <p>Cảm ơn bạn đã đặt hàng!</p>
            <p className="order-code">Mã đơn hàng: <strong>#{orderSuccess?.orderId?.slice(-8)}</strong></p>
            <p className="order-total">Tổng tiền: <strong>{formatCurrency(orderSuccess?.totalAmount)}</strong></p>
            <div className="modal-buttons">
              <button onClick={() => handleCloseSuccessModal('order-detail')} className="btn-primary">Xem chi tiết</button>
              <button onClick={() => handleCloseSuccessModal('shop')} className="btn-secondary">Tiếp tục mua sắm</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; display: inline-block; }
        
        .toast-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10000;
          animation: fadeInOut 2.5s forwards;
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 20px 32px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .toast-content.success { border-left: 4px solid #2e7d32; color: #2e7d32; }
        .toast-content.error { border-left: 4px solid #dc3545; color: #dc3545; }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
        
        .checkout-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .checkout-section h2 {
          font-size: 18px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .edit-btn {
          background: none;
          border: none;
          color: #2e7d32;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .address-display {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 12px;
          line-height: 1.6;
        }
        .address-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .address-form input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .form-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .cancel-btn {
          padding: 8px 16px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
        }
        .save-btn {
          padding: 8px 16px;
          background: #2e7d32;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .checkout-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .checkout-item img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }
        .item-name { font-weight: 500; }
        .item-variant { font-size: 12px; color: #999; }
        .item-quantity { font-size: 12px; color: #666; }
        .item-price { margin-left: auto; font-weight: 500; color: #d32f2f; }
        
        .voucher-input { display: flex; gap: 12px; margin-bottom: 12px; }
        .voucher-input input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
        .apply-voucher-btn, .remove-voucher-btn { padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; color: white; }
        .apply-voucher-btn { background: #2e7d32; }
        .remove-voucher-btn { background: #dc3545; }
        .applied-voucher { background: #e8f5e9; padding: 8px 12px; border-radius: 8px; color: #2e7d32; margin-top: 8px; }
        .show-vouchers-btn { margin-top: 12px; color: #2e7d32; background: none; border: none; cursor: pointer; }
        .voucher-list { margin-top: 12px; border-top: 1px solid #eee; padding-top: 12px; }
        .voucher-item { padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; cursor: pointer; }
        .voucher-item.selected { background: #e8f5e9; border: 1px solid #2e7d32; }
        .voucher-code { font-weight: 500; }
        .voucher-desc { font-size: 12px; color: #666; }
        
        .order-summary {
          position: sticky;
          top: 100px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .order-summary h2 { font-size: 18px; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .summary-row.discount { color: #2e7d32; }
        .summary-divider { height: 1px; background: #eee; margin: 16px 0; }
        .summary-row.total { margin-top: 12px; font-size: 18px; font-weight: bold; }
        .summary-row.total span:last-child { color: #d32f2f; font-size: 24px; }
        
        .payment-methods { margin: 20px 0; }
        .payment-methods h3 { font-size: 16px; margin-bottom: 12px; }
        .payment-method {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          border: 1px solid #e0e0e0;
        }
        .payment-method.active { background: #e8f5e9; border-color: #2e7d32; }
        .payment-method input { margin: 0; }
        .method-name { font-weight: 500; font-size: 14px; }
        .method-desc { font-size: 12px; color: #666; }
        
        .submit-order-btn {
          width: 100%;
          padding: 16px;
          background: #2e7d32;
          color: white;
          border: none;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 12px;
        }
        .submit-order-btn:disabled { background: #ccc; cursor: not-allowed; }
        .back-to-cart-btn {
          width: 100%;
          padding: 12px;
          background: white;
          color: #2e7d32;
          border: 1px solid #2e7d32;
          border-radius: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
        }
        .success-modal {
          background: white;
          border-radius: 24px;
          max-width: 450px;
          width: 90%;
          padding: 32px;
          text-align: center;
        }
        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #2e7d32, #4caf50);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .success-icon svg { font-size: 48px; color: white; }
        .success-modal h2 { color: #2e7d32; margin-bottom: 8px; }
        .order-code, .order-total { margin: 8px 0; }
        .modal-buttons { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
        .btn-primary, .btn-secondary { padding: 12px 24px; border-radius: 40px; cursor: pointer; }
        .btn-primary { background: #2e7d32; color: white; border: none; }
        .btn-secondary { background: white; color: #2e7d32; border: 1px solid #2e7d32; }
        
        textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 12px; resize: vertical; font-family: inherit; }
      `}</style>
    </ShopDetailLayout>
  );
};

export default CheckoutPage;