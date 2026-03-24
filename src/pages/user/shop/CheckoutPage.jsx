import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import api from "../../../api/api";
import { 
  FaTruck, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaUser, 
  FaEdit, 
  FaTag, 
  FaCreditCard,
  FaMoneyBillWave,
  FaUniversity,
  FaPaypal,
  FaArrowLeft,
  FaCheckCircle,
  FaSpinner,
  FaTrash,
  FaSave,
  FaTimes,
  FaHome,
  FaRoad,
  FaCity,
  FaGlobe,
  FaShoppingCart
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
    const [userInfo, setUserInfo] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [toast, setToast] = useState({ show: false, message: '', type: 'success', id: null });
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [editAddress, setEditAddress] = useState({
        name: "",
        phone: "",
        street: "",
        ward: "",
        district: "",
        city: "",
        country: "Việt Nam"
    });
    // Thêm state để lưu shop_id
    const [currentShopId, setCurrentShopId] = useState(null);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToast({ show: true, message, type, id });
        setTimeout(() => {
            setToast(prev => {
                if (prev.id === id) {
                    return { show: false, message: '', type: 'success', id: null };
                }
                return prev;
            });
        }, 2500);
    };

    useEffect(() => {
        loadCheckoutData();
        fetchUserInfo();
    }, []);

    // Khi selectedItems thay đổi, lấy shop_id và fetch vouchers
    useEffect(() => {
        if (selectedItems.length > 0) {
            // Lấy shop_id từ item đầu tiên
            const shopId = selectedItems[0]?.shop_id;
            if (shopId) {
                setCurrentShopId(shopId);
                fetchAvailableVouchers(shopId);
            }
        }
    }, [selectedItems]);

    const fetchUserInfo = async () => {
        try {
            const response = await api.get('/api/v1/auth/me');
            setUserInfo(response.data);
            
            let street = "", ward = "", district = "", city = "";
            if (response.data.address) {
                const parts = response.data.address.split(',');
                if (parts.length >= 1) street = parts[0].trim();
                if (parts.length >= 2) ward = parts[1].trim();
                if (parts.length >= 3) district = parts[2].trim();
                if (parts.length >= 4) city = parts[3].trim();
            }
            
            setShippingAddress({
                name: response.data.full_name || response.data.username,
                phone: response.data.phone || "",
                street: street,
                ward: ward,
                district: district,
                city: city,
                country: "Việt Nam"
            });
            
            setEditAddress({
                name: response.data.full_name || response.data.username,
                phone: response.data.phone || "",
                street: street,
                ward: ward,
                district: district,
                city: city,
                country: "Việt Nam"
            });
        } catch (error) {
            console.error("Error fetching user info:", error);
            setUserInfo({
                full_name: "Nguyễn Văn A",
                username: "nguyenvana",
                phone: "0987654321",
                address: ""
            });
            setShippingAddress({
                name: "Nguyễn Văn A",
                phone: "0987654321",
                street: "",
                ward: "",
                district: "",
                city: "",
                country: "Việt Nam"
            });
        }
    };

    const handlePayment = async (orderId, amount, method) => {
        try {
            setPaymentProcessing(true);
            
            // Tạo payment request
            const paymentResponse = await api.post('/api/v1/payments/create', {
                order_id: orderId,
                method: method,
                amount: amount
            });
            
            console.log('Payment response:', paymentResponse.data);
            
            // Chuyển hướng đến trang thanh toán
            if (paymentResponse.data.payment_url) {
                window.location.href = paymentResponse.data.payment_url;
            } else {
                throw new Error('Không nhận được URL thanh toán');
            }
        } catch (error) {
            console.error('Payment error:', error);
            showToast(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo thanh toán', 'error');
            setPaymentProcessing(false);
        }
    };

    const fetchAvailableVouchers = async (shopId) => {
        setVoucherLoading(true);
        try {
            const selectedTotal = getSelectedTotal();
            console.log("Fetching vouchers with:", {
                shop_id: shopId,
                order_total: selectedTotal
            });
            
            const response = await api.get('/api/v1/vouchers/available', {
                params: {
                    shop_id: shopId,
                    order_total: selectedTotal
                }
            });
            setAvailableVouchers(response.data || []);
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            setAvailableVouchers([]);
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
                // Lấy shop_id từ item đầu tiên
                if (parsedItems.length > 0 && parsedItems[0].shop_id) {
                    setCurrentShopId(parsedItems[0].shop_id);
                }
            } catch (error) {
                console.error("Error parsing selected items:", error);
                setSelectedItems([]);
            }
        } else {
            setSelectedItems([]);
        }
        
        const voucher = localStorage.getItem('selectedVoucher');
        if (voucher && voucher !== 'null' && voucher !== 'undefined') {
            try {
                const parsedVoucher = JSON.parse(voucher);
                setSelectedVoucher(parsedVoucher);
                setVoucherCode(parsedVoucher.code || "");
            } catch (error) {
                console.error("Error parsing voucher:", error);
                setSelectedVoucher(null);
                setVoucherCode("");
            }
        } else {
            setSelectedVoucher(null);
            setVoucherCode("");
        }
        
        setLoading(false);
    };

    const handleEditAddress = () => {
        setEditAddress({
            name: shippingAddress?.name || "",
            phone: shippingAddress?.phone || "",
            street: shippingAddress?.street || "",
            ward: shippingAddress?.ward || "",
            district: shippingAddress?.district || "",
            city: shippingAddress?.city || "",
            country: shippingAddress?.country || "Việt Nam"
        });
        setShowAddressForm(true);
    };

    const handleSaveAddress = () => {
        if (!editAddress.name.trim()) {
            showToast("Vui lòng nhập tên người nhận", "error");
            return;
        }
        if (!editAddress.phone.trim()) {
            showToast("Vui lòng nhập số điện thoại", "error");
            return;
        }
        if (!editAddress.street.trim()) {
            showToast("Vui lòng nhập số nhà và tên đường", "error");
            return;
        }
        if (!editAddress.ward.trim()) {
            showToast("Vui lòng nhập phường/xã", "error");
            return;
        }
        if (!editAddress.district.trim()) {
            showToast("Vui lòng nhập quận/huyện", "error");
            return;
        }
        if (!editAddress.city.trim()) {
            showToast("Vui lòng nhập tỉnh/thành phố", "error");
            return;
        }
        
        setShippingAddress({
            name: editAddress.name,
            phone: editAddress.phone,
            street: editAddress.street,
            ward: editAddress.ward,
            district: editAddress.district,
            city: editAddress.city,
            country: editAddress.country
        });
        
        showToast("Cập nhật địa chỉ thành công!", "success");
        setShowAddressForm(false);
    };

    const handleCancelAddress = () => {
        setShowAddressForm(false);
        setEditAddress({
            name: shippingAddress?.name || "",
            phone: shippingAddress?.phone || "",
            street: shippingAddress?.street || "",
            ward: shippingAddress?.ward || "",
            district: shippingAddress?.district || "",
            city: shippingAddress?.city || "",
            country: shippingAddress?.country || "Việt Nam"
        });
    };

    const formatFullAddress = (address) => {
        if (!address) return "";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.ward) parts.push(address.ward);
        if (address.district) parts.push(address.district);
        if (address.city) parts.push(address.city);
        if (address.country) parts.push(address.country);
        return parts.join(", ");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const getSelectedTotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
    };

    const calculateDiscount = () => {
        const selectedTotal = getSelectedTotal();
        if (!selectedVoucher) return 0;
        if (selectedVoucher.discount_type === "percent") {
            const discount = (selectedTotal * selectedVoucher.discount_value) / 100;
            if (selectedVoucher.max_discount) {
                return Math.min(discount, selectedVoucher.max_discount);
            }
            return discount;
        }
        return selectedVoucher.discount_value;
    };

    const calculateShipping = () => {
        if (selectedVoucher && selectedVoucher.code === "FREESHIP") {
            return 0;
        }
        if (getSelectedTotal() >= 200000) {
            return 0;
        }
        return 15000;
    };

    const finalTotal = getSelectedTotal() - calculateDiscount() + calculateShipping();

    // Sửa applyVoucher để gửi shop_id
    const applyVoucher = async () => {
        if (!voucherCode.trim()) {
            showToast("Vui lòng nhập mã giảm giá", "error");
            return;
        }
        
        setApplyingVoucher(true);
        setVoucherError("");
        
        try {
            const params = {
                code: voucherCode.toUpperCase(),
                order_total: getSelectedTotal()
            };
            
            // Thêm shop_id nếu có
            if (currentShopId) {
                params.shop_id = currentShopId;
            }
            
            console.log("Applying voucher with params:", params);
            
            const response = await api.post('/api/v1/vouchers/validate', null, {
                params: params
            });
            
            console.log("Validate response:", response.data);
            
            if (response.data && response.data.discount !== undefined && response.data.voucher) {
                const voucherData = {
                    _id: response.data.voucher._id,
                    id: response.data.voucher._id,
                    code: response.data.voucher.code,
                    discount_type: response.data.voucher.discount_type,
                    discount_value: response.data.voucher.discount_value,
                    discount: response.data.discount,
                    min_order_value: response.data.voucher.min_order_value,
                    max_discount: response.data.voucher.max_discount,
                    shop_id: response.data.voucher.shop_id
                };
                setSelectedVoucher(voucherData);
                showToast(`Áp dụng mã ${voucherCode.toUpperCase()} thành công! Giảm ${formatCurrency(response.data.discount)}`, "success");
            } else if (response.data && response.data.error) {
                setVoucherError(response.data.error);
                showToast(response.data.error, "error");
            }
        } catch (error) {
            console.error("Error applying voucher:", error);
            if (error.response && error.response.data && error.response.data.error) {
                setVoucherError(error.response.data.error);
                showToast(error.response.data.error, "error");
            } else {
                setVoucherError("Mã giảm giá không hợp lệ");
                showToast("Mã giảm giá không hợp lệ", "error");
            }
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

    const handleSubmitOrder = async () => {
        if (!shippingAddress || !shippingAddress.street) {
            showToast("Vui lòng cập nhật địa chỉ nhận hàng", "error");
            return;
        }
        
        if (selectedItems.length === 0) {
            showToast("Không có sản phẩm nào để đặt hàng", "error");
            return;
        }
        
        setSubmitting(true);
        try {
            const response = await api.post('/api/v1/orders', {
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
                    full_address: formatFullAddress(shippingAddress)
                },
                note: note || "",
                payment_method: paymentMethod,
                voucher: selectedVoucher ? {
                    id: selectedVoucher._id,
                    code: selectedVoucher.code,
                    discount: calculateDiscount()
                } : null
            });
            
            console.log("Order response:", response.data);
            const order = response.data;
            
            // Xử lý voucher nếu có
            if (selectedVoucher && selectedVoucher._id) {
                try {
                    await api.post(`/api/v1/vouchers/${selectedVoucher._id}/use`);
                } catch (error) {
                    console.error("Error increasing voucher usage:", error);
                }
            }
            
            // Xóa sản phẩm khỏi giỏ hàng
            for (const item of selectedItems) {
                try {
                    await api.delete('/api/v1/cart/remove', {
                        params: {
                            product_id: item.product_id,
                            variant_id: item.variant_id || null
                        }
                    });
                } catch (error) {
                    console.error("Error removing item from cart:", error);
                }
            }
            
            // Xóa localStorage
            localStorage.removeItem('selectedCartItems');
            localStorage.removeItem('selectedTotal');
            localStorage.removeItem('selectedVoucher');
            localStorage.removeItem('finalTotal');
            
            // Lưu thông tin đơn hàng để hiển thị trong modal
            setOrderSuccess({
                orderId: order.id || order._id,
                totalAmount: finalTotal,
                paymentMethod: paymentMethod
            });
            
            // Xử lý theo phương thức thanh toán
            if (paymentMethod === 'cod') {
                setShowSuccessModal(true);
                setSubmitting(false);
            } else if (paymentMethod === 'bank') {
                setShowSuccessModal(true);
                setSubmitting(false);
            } else if (paymentMethod === 'momo' || paymentMethod === 'vnpay' || paymentMethod === 'zalopay') {
                await handlePayment(order.id || order._id, finalTotal, paymentMethod);
            } else if (paymentMethod === 'paypal') {
                await handlePayment(order.id || order._id, finalTotal, 'paypal');
            } else if (paymentMethod === 'card') {
                await handlePayment(order.id || order._id, finalTotal, 'vnpay');
            }
            
        } catch (error) {
            console.error("Error placing order:", error);
            
            let errorMessage = "Có lỗi xảy ra, vui lòng thử lại!";
            
            if (error.response) {
                if (error.response.status === 422) {
                    const errorData = error.response.data;
                    if (Array.isArray(errorData.detail)) {
                        const validationErrors = errorData.detail.map(err => 
                            `${err.loc?.join('.')}: ${err.msg}`
                        ).join(', ');
                        errorMessage = validationErrors;
                    } else if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else {
                        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
                    }
                } else if (error.response.data && error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
            }
            
            showToast(errorMessage, "error");
            setSubmitting(false);
        }
    };

    const handleCloseSuccessModal = (navigateTo) => {
        setShowSuccessModal(false);
        if (navigateTo === 'orders') {
            // Chuyển đến trang danh sách đơn hàng
            navigate('/orders');
        } else if (navigateTo === 'order-detail') {
            // Chuyển đến trang chi tiết đơn hàng vừa đặt
            navigate(`/orders/${orderSuccess.orderId}`);
        } else if (navigateTo === 'shop') {
            navigate('/');
        }
    };
    // Sửa onClick handler cho voucher list
    const handleVoucherClick = async (v) => {
        try {
            const params = {
                code: v.code,
                order_total: getSelectedTotal()
            };
            
            if (currentShopId) {
                params.shop_id = currentShopId;
            }
            
            console.log("Applying voucher from list:", params);
            
            const response = await api.post('/api/v1/vouchers/validate', null, {
                params: params
            });
            
            console.log("Validate response from list:", response.data);
            
            if (response.data && response.data.discount !== undefined && response.data.voucher) {
                setSelectedVoucher({
                    ...v,
                    discount: response.data.discount,
                    discount_value: v.discount_value,
                    discount_type: v.discount_type,
                    code: v.code
                });
                setVoucherCode(v.code);
                showToast(`Áp dụng mã ${v.code} thành công! Giảm ${formatCurrency(response.data.discount)}`, "success");
                setShowVouchers(false);
            } else if (response.data && response.data.error) {
                showToast(response.data.error, "error");
            } else {
                showToast("Không thể áp dụng voucher này", "error");
            }
        } catch (error) {
            console.error("Error applying voucher:", error);
            if (error.response?.data?.error) {
                showToast(error.response.data.error, "error");
            } else {
                showToast("Không thể áp dụng voucher này", "error");
            }
        }
    };

    if (loading) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
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
                    <h2 style={{ marginTop: "20px", color: "#666" }}>Không có sản phẩm để thanh toán</h2>
                    <p style={{ color: "#999", marginBottom: "30px" }}>Vui lòng chọn sản phẩm từ giỏ hàng</p>
                    <button 
                        onClick={() => navigate('/cart')}
                        style={{ padding: "12px 32px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}
                    >
                        Quay lại giỏ hàng
                    </button>
                </div>
            </ShopDetailLayout>
        );
    }

    return (
        <ShopDetailLayout>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
                {/* Toast Notification - giữ nguyên */}
                {toast.show && (
                    <div style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10000,
                        animation: "toastFadeInOut 2.5s ease forwards",
                        pointerEvents: "none"
                    }}>
                        <div style={{
                            background: "white",
                            borderRadius: "20px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                            padding: "32px 48px",
                            minWidth: "320px",
                            maxWidth: "450px",
                            textAlign: "center",
                            backdropFilter: "blur(10px)",
                            backgroundColor: "rgba(255,255,255,0.98)"
                        }}>
                            <div style={{
                                width: "80px",
                                height: "80px",
                                margin: "0 auto 20px",
                                background: toast.type === 'success' 
                                    ? "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)"
                                    : "linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: toast.type === 'success' 
                                    ? "0 8px 20px rgba(46,125,50,0.3)"
                                    : "0 8px 20px rgba(220,53,69,0.3)"
                            }}>
                                {toast.type === 'success' ? (
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                )}
                            </div>
                            <div style={{ 
                                fontSize: "20px", 
                                fontWeight: "bold", 
                                color: toast.type === 'success' ? "#2e7d32" : "#dc3545", 
                                marginBottom: "8px" 
                            }}>
                                {toast.type === 'success' ? "Thành công!" : "Thất bại!"}
                            </div>
                            <div style={{ fontSize: "16px", color: "#666", lineHeight: "1.5" }}>
                                {toast.message}
                            </div>
                            <div style={{
                                width: "60px",
                                height: "3px",
                                background: toast.type === 'success' 
                                    ? "linear-gradient(90deg, #2e7d32, #4caf50, #2e7d32)"
                                    : "linear-gradient(90deg, #dc3545, #ff6b6b, #dc3545)",
                                margin: "20px auto 0",
                                borderRadius: "3px"
                            }} />
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                <div style={{ marginBottom: "24px", fontSize: "14px", color: "#666" }}>
                    <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate('/')}>Trang chủ</span>
                    <span style={{ margin: "0 8px" }}>›</span>
                    <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate('/cart')}>Giỏ hàng</span>
                    <span style={{ margin: "0 8px" }}>›</span>
                    <span style={{ color: "#333" }}>Thanh toán</span>
                </div>

                <h1 style={{ fontSize: "28px", marginBottom: "24px", fontWeight: "600" }}>Thanh toán</h1>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px" }}>
                    {/* Left - Checkout Form */}
                    <div>
                        {/* Địa chỉ nhận hàng - giữ nguyên */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h2 style={{ fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FaMapMarkerAlt color="#2e7d32" /> Địa Chỉ Nhận Hàng
                                </h2>
                                {!showAddressForm && (
                                    <button 
                                        onClick={handleEditAddress}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#2e7d32",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "14px"
                                        }}
                                    >
                                        <FaEdit /> Thay Đổi
                                    </button>
                                )}
                            </div>
                            
                            {!showAddressForm ? (
                                shippingAddress && (
                                    <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                            <FaUser color="#2e7d32" />
                                            <span style={{ fontWeight: "500" }}>{shippingAddress.name}</span>
                                            <FaPhone color="#2e7d32" style={{ marginLeft: "12px" }} />
                                            <span>{shippingAddress.phone}</span>
                                        </div>
                                        <div style={{ color: "#666", lineHeight: "1.5", marginTop: "8px", paddingLeft: "28px" }}>
                                            <div><FaHome size={12} style={{ marginRight: "8px" }} /> {shippingAddress.street || "Chưa cập nhật"}</div>
                                            <div style={{ marginTop: "4px" }}>{shippingAddress.ward && `Phường/Xã: ${shippingAddress.ward}`}</div>
                                            <div>{shippingAddress.district && `Quận/Huyện: ${shippingAddress.district}`}</div>
                                            <div>{shippingAddress.city && `Tỉnh/Thành phố: ${shippingAddress.city}`}</div>
                                            <div>{shippingAddress.country && `Quốc gia: ${shippingAddress.country}`}</div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                // Form chỉnh sửa địa chỉ - giữ nguyên
                                <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "16px" }}>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Họ và tên <span style={{ color: "#dc3545" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editAddress.name}
                                            onChange={(e) => setEditAddress({ ...editAddress, name: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="Nhập họ tên người nhận"
                                        />
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Số điện thoại <span style={{ color: "#dc3545" }}>*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={editAddress.phone}
                                            onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Số nhà, tên đường <span style={{ color: "#dc3545" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editAddress.street}
                                            onChange={(e) => setEditAddress({ ...editAddress, street: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="VD: 123 Nguyễn Văn A"
                                        />
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Phường/Xã <span style={{ color: "#dc3545" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editAddress.ward}
                                            onChange={(e) => setEditAddress({ ...editAddress, ward: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="VD: Phường Hòa Hải"
                                        />
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Quận/Huyện <span style={{ color: "#dc3545" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editAddress.district}
                                            onChange={(e) => setEditAddress({ ...editAddress, district: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="VD: Quận Ngũ Hành Sơn"
                                        />
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Tỉnh/Thành phố <span style={{ color: "#dc3545" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editAddress.city}
                                            onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="VD: Đà Nẵng"
                                        />
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                                            Quốc gia
                                        </label>
                                        <input
                                            type="text"
                                            value={editAddress.country}
                                            onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                fontSize: "14px"
                                            }}
                                            placeholder="Việt Nam"
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                                        <button
                                            onClick={handleCancelAddress}
                                            style={{
                                                padding: "8px 16px",
                                                background: "#f5f5f5",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <FaTimes /> Hủy
                                        </button>
                                        <button
                                            onClick={handleSaveAddress}
                                            style={{
                                                padding: "8px 16px",
                                                background: "#2e7d32",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <FaSave /> Lưu
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sản Phẩm */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FaTruck color="#2e7d32" /> Sản Phẩm
                            </h2>
                            
                            {selectedItems.map((item, index) => (
                                <div key={index} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "12px 0",
                                    borderBottom: index < selectedItems.length - 1 ? "1px solid #eee" : "none"
                                }}>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                        <img 
                                            src={item.image_url || "https://via.placeholder.com/60"} 
                                            alt={item.product_name}
                                            style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: "500" }}>{item.product_name}</div>
                                            {item.variant_name && (
                                                <div style={{ fontSize: "12px", color: "#999" }}>{item.variant_name}</div>
                                            )}
                                            <div style={{ fontSize: "12px", color: "#666" }}>x{item.quantity}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: "500", color: "#d32f2f" }}>
                                        {formatCurrency(item.price)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Voucher */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <FaTag color="#2e7d32" /> Voucher
                            </h2>
                            
                            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                                <input
                                    type="text"
                                    placeholder="Nhập mã giảm giá"
                                    value={voucherCode}
                                    onChange={(e) => {
                                        setVoucherCode(e.target.value);
                                        setVoucherError("");
                                        if (selectedVoucher) {
                                            setSelectedVoucher(null);
                                        }
                                    }}
                                    disabled={selectedVoucher !== null}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        border: `1px solid ${voucherError ? "#dc3545" : selectedVoucher ? "#2e7d32" : "#ddd"}`,
                                        borderRadius: "8px",
                                        outline: "none",
                                        background: selectedVoucher ? "#f5f5f5" : "white"
                                    }}
                                />
                                {selectedVoucher ? (
                                    <button 
                                        onClick={removeVoucher}
                                        style={{
                                            padding: "12px 20px",
                                            background: "#dc3545",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Xóa
                                    </button>
                                ) : (
                                    <button 
                                        onClick={applyVoucher}
                                        disabled={applyingVoucher}
                                        style={{
                                            padding: "12px 20px",
                                            background: "#2e7d32",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: applyingVoucher ? "not-allowed" : "pointer",
                                            opacity: applyingVoucher ? 0.7 : 1
                                        }}
                                    >
                                        {applyingVoucher ? <FaSpinner className="spinning" /> : "Áp dụng"}
                                    </button>
                                )}
                            </div>
                            
                            {selectedVoucher && (
                                <div style={{
                                    background: "#e8f5e9",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    color: "#2e7d32",
                                    marginTop: "8px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <span>
                                        Đã áp dụng mã {selectedVoucher.code} - Giảm {selectedVoucher.discount_type === "percent" ? `${selectedVoucher.discount_value}%` : formatCurrency(selectedVoucher.discount_value)}
                                    </span>
                                    <button onClick={removeVoucher} style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer" }}>
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setShowVouchers(!showVouchers)}
                                style={{
                                    marginTop: "12px",
                                    color: "#2e7d32",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px"
                                }}
                            >
                                Xem thêm voucher {showVouchers ? "▲" : "▼"}
                            </button>
                            
                            {showVouchers && (
                                <div style={{ marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                                    {voucherLoading ? (
                                        <div style={{ textAlign: "center", padding: "20px" }}>
                                            <FaSpinner className="spinning" />
                                        </div>
                                    ) : availableVouchers.length > 0 ? (
                                        availableVouchers.map(v => (
                                            <div key={v._id} style={{
                                                padding: "10px",
                                                marginBottom: "8px",
                                                background: selectedVoucher?._id === v._id ? "#e8f5e9" : "#f8f9fa",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                transition: "background 0.2s",
                                                border: selectedVoucher?._id === v._id ? "1px solid #2e7d32" : "none"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#e8f5e9"}
                                            onMouseLeave={(e) => {
                                                if (selectedVoucher?._id !== v._id) {
                                                    e.currentTarget.style.background = "#f8f9fa";
                                                }
                                            }}
                                            onClick={() => handleVoucherClick(v)}
                                            >
                                                <div style={{ fontWeight: "500", fontSize: "14px" }}>{v.code}</div>
                                                <div style={{ fontSize: "12px", color: "#666" }}>
                                                    Giảm {v.discount_type === "percent" ? `${v.discount_value}%` : formatCurrency(v.discount_value)}
                                                    {v.min_order_value > 0 && ` cho đơn từ ${formatCurrency(v.min_order_value)}`}
                                                    {v.end_date && ` · Hết hạn: ${new Date(v.end_date).toLocaleDateString('vi-VN')}`}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                                            Không có voucher nào
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Lời nhắn */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
                                Lời nhắn
                            </h2>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Lưu ý cho người bán..."
                                rows="3"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "1px solid #ddd",
                                    borderRadius: "12px",
                                    resize: "vertical",
                                    fontSize: "14px",
                                    fontFamily: "inherit"
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Sticky Container */}
                    <div>
                        <div style={{
                            position: "sticky",
                            top: "100px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px"
                        }}>
                            {/* Đơn hàng */}
                            <div style={{
                                background: "white",
                                borderRadius: "16px",
                                padding: "24px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}>
                                <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                                    Đơn hàng
                                </h2>
                                
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                        <span style={{ color: "#666" }}>Tiền sản phẩm</span>
                                        <span>{formatCurrency(getSelectedTotal())}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                        <span style={{ color: "#666" }}>Giá tiền vận chuyển</span>
                                        <span>{formatCurrency(calculateShipping())}</span>
                                    </div>
                                    {selectedVoucher && (
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "#2e7d32" }}>
                                            <span>Giảm giá ({selectedVoucher.code})</span>
                                            <span>- {formatCurrency(calculateDiscount())}</span>
                                        </div>
                                    )}
                                    <div style={{ height: "1px", background: "#eee", margin: "16px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                        <span style={{ fontWeight: "600", fontSize: "18px" }}>Tổng tiền</span>
                                        <span style={{ fontWeight: "bold", fontSize: "24px", color: "#d32f2f" }}>
                                            {formatCurrency(finalTotal)}
                                        </span>
                                    </div>
                                </div>

                                {/* Phương thức thanh toán */}
                                <div style={{ marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Phương thức thanh toán</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px", background: paymentMethod === "cod" ? "#f5f5f5" : "transparent" }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="cod"
                                                checked={paymentMethod === "cod"}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <FaMoneyBillWave color="#2e7d32" />
                                            <span>Thanh toán khi nhận hàng (COD)</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px", background: paymentMethod === "bank" ? "#f5f5f5" : "transparent" }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="bank"
                                                checked={paymentMethod === "bank"}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <FaUniversity color="#2e7d32" />
                                            <span>Chuyển khoản ngân hàng</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px", background: paymentMethod === "card" ? "#f5f5f5" : "transparent" }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="card"
                                                checked={paymentMethod === "card"}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <FaCreditCard color="#2e7d32" />
                                            <span>Thẻ tín dụng / Ghi nợ</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px", borderRadius: "8px", background: paymentMethod === "paypal" ? "#f5f5f5" : "transparent" }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="paypal"
                                                checked={paymentMethod === "paypal"}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <FaPaypal color="#2e7d32" />
                                            <span>PayPal</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Nút đặt hàng */}
                                <button 
                                    onClick={handleSubmitOrder}
                                    disabled={submitting || paymentProcessing}
                                    style={{
                                        width: "100%",
                                        padding: "16px",
                                        background: (submitting || paymentProcessing) ? "#ccc" : "#2e7d32",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "40px",
                                        fontWeight: "600",
                                        fontSize: "16px",
                                        cursor: (submitting || paymentProcessing) ? "not-allowed" : "pointer",
                                        transition: "all 0.3s",
                                        opacity: (submitting || paymentProcessing) ? 0.7 : 1
                                    }}
                                    onMouseEnter={(e) => { if (!submitting && !paymentProcessing) e.currentTarget.style.background = "#1b5e20"; }}
                    onMouseLeave={(e) => { if (!submitting && !paymentProcessing) e.currentTarget.style.background = "#2e7d32"; }}
                >
                    {(submitting || paymentProcessing) ? <FaSpinner className="spinning" /> : "Đặt hàng"}
                                </button>

                                {/* Nút quay lại */}
                                <button 
                                    onClick={() => navigate('/cart')}
                                    style={{
                                        width: "100%",
                                        marginTop: "12px",
                                        padding: "12px",
                                        background: "white",
                                        color: "#2e7d32",
                                        border: "1px solid #2e7d32",
                                        borderRadius: "40px",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        transition: "all 0.3s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                >
                                    <FaArrowLeft /> Quay lại giỏ hàng
                                </button>
                            </div>

                            {/* Dịch vụ khách hàng - giữ nguyên */}
                            <div style={{
                                background: "white",
                                borderRadius: "16px",
                                padding: "20px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>DỊCH VỤ KHÁCH HÀNG</h3>
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Trung Tâm Trợ Giúp
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Shop Mall
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Hướng Dẫn Mua Hàng/Đặt Hàng
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Hướng Dẫn Bán Hàng
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Đơn Hàng
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Trả Hàng/Hoàn Tiền
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Liên Hệ
                                        </a>
                                    </li>
                                    <li style={{ marginBottom: "8px" }}>
                                        <a href="#" style={{ color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                                           onMouseEnter={(e) => e.target.style.color = "#2e7d32"}
                                           onMouseLeave={(e) => e.target.style.color = "#666"}>
                                            Chính Sách Bảo Hành
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

           
            {/* Success Modal */}
{showSuccessModal && (
    <div className="modal-overlay" onClick={() => handleCloseSuccessModal('stay')}>
        <div className="modal-content success-modal" onClick={e => e.stopPropagation()}>
            <div className="success-icon">
                <FaCheckCircle />
            </div>
            <h2>Đặt hàng thành công!</h2>
            <div className="success-message">
                <p>Cảm ơn bạn đã đặt hàng tại <strong>Organic Food</strong>!</p>
                {orderSuccess && (
                    <>
                        <p className="order-info">
                            Mã đơn hàng: <strong>#{orderSuccess.orderId?.slice(-8)}</strong>
                        </p>
                        <p className="order-info">
                            Tổng tiền: <strong className="total-amount">{formatCurrency(orderSuccess.totalAmount)}</strong>
                        </p>
                        <p className="order-info">
                            Phương thức thanh toán: <strong>
                                {orderSuccess.paymentMethod === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : 
                                 orderSuccess.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 
                                 orderSuccess.paymentMethod}
                            </strong>
                        </p>
                    </>
                )}
                <p className="note">
                    {orderSuccess?.paymentMethod === 'cod' ? 
                        'Đơn hàng sẽ được xử lý và giao đến bạn trong thời gian sớm nhất.' : 
                        'Vui lòng kiểm tra hướng dẫn thanh toán trong email hoặc tin nhắn.'}
                </p>
            </div>
            <div className="modal-buttons">
                <button 
                    className="btn-primary"
                    onClick={() => handleCloseSuccessModal('order-detail')}
                >
                    Xem chi tiết đơn hàng
                </button>
                <button 
                    className="btn-secondary"
                    onClick={() => handleCloseSuccessModal('shop')}
                >
                    Tiếp tục mua sắm
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
    @keyframes toastFadeInOut {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }
        15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        85% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
            visibility: hidden;
        }
    }
    
    /* Success Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: fadeIn 0.3s ease;
    }
    
    .success-modal {
        background: white;
        border-radius: 24px;
        max-width: 480px;
        width: 90%;
        padding: 32px;
        text-align: center;
        animation: slideUp 0.3s ease;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .success-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        animation: scaleIn 0.5s ease;
    }
    
    .success-icon svg {
        font-size: 48px;
        color: white;
    }
    
    .success-modal h2 {
        color: #2e7d32;
        font-size: 28px;
        margin-bottom: 16px;
        font-weight: 600;
    }
    
    .success-message {
        margin-bottom: 32px;
    }
    
    .success-message p {
        color: #666;
        line-height: 1.6;
        margin: 8px 0;
    }
    
    .order-info {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .order-info strong {
        color: #2e7d32;
    }
    
    .total-amount {
        font-size: 20px;
        color: #d32f2f;
    }
    
    .note {
        font-size: 13px;
        color: #999;
        margin-top: 16px;
    }
    
    .modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
    }
    
    .btn-primary, .btn-secondary {
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        border: none;
        font-size: 14px;
    }
    
    .btn-primary {
        background: #2e7d32;
        color: white;
    }
    
    .btn-primary:hover {
        background: #1b5e20;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
    }
    
    .btn-secondary {
        background: white;
        color: #2e7d32;
        border: 2px solid #2e7d32;
    }
    
    .btn-secondary:hover {
        background: #f5f5f5;
        transform: translateY(-2px);
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes scaleIn {
        from {
            transform: scale(0);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
            `}</style>
        </ShopDetailLayout>
    );
};

export default CheckoutPage;