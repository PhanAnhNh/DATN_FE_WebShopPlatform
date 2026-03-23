// pages/user/cart/CartPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { 
  FaTrash, 
  FaMinus, 
  FaPlus, 
  FaShoppingCart, 
  FaTag, 
  FaCreditCard,
  FaMoneyBillWave,
  FaUniversity,
  FaPaypal,
  FaTruck,
  FaArrowLeft,
  FaCheckCircle,
  FaRegCheckCircle,
  FaSpinner
} from 'react-icons/fa';
import ShopDetailLayout from "../../components/layout/ShopDetailLayout";

const CartPage = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState({ items: [], total_price: 0 });
    const [loading, setLoading] = useState(true);
    const [updatingItems, setUpdatingItems] = useState({});
    const [selectedItems, setSelectedItems] = useState({});
    const [selectAll, setSelectAll] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [showVouchers, setShowVouchers] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [applyingVoucher, setApplyingVoucher] = useState(false);
    const [voucherError, setVoucherError] = useState("");
    const [toast, setToast] = useState({ show: false, message: '', type: 'success', id: null });

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

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/cart');
            console.log("Cart API response:", response.data);
            const cartData = response.data;
            setCart(cartData);
            
            const initialSelected = {};
            cartData.items.forEach(item => {
                const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                initialSelected[itemKey] = true;
            });
            setSelectedItems(initialSelected);
            setSelectAll(true);
        } catch (error) {
            console.error("Error fetching cart:", error);
            // Mock data for development
            const mockCartData = {
                items: [
                    {
                        product_id: "1",
                        product_name: "Bơ tươi, trồng tại vườn",
                        quantity: 1,
                        price: 10000,
                        image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=100",
                        variant_name: "1kg",
                        subtotal: 10000,
                        shop_id: "69b9170027a68c9753b5290a"
                    },
                    {
                        product_id: "2",
                        product_name: "Bơ tươi, trồng tại vườn",
                        quantity: 2,
                        price: 20000,
                        image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=100",
                        variant_name: "2kg",
                        subtotal: 40000,
                        shop_id: "69b9170027a68c9753b5290a"
                    }
                ],
                total_price: 50000
            };
            setCart(mockCartData);
            
            const initialSelected = {};
            mockCartData.items.forEach(item => {
                const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                initialSelected[itemKey] = true;
            });
            setSelectedItems(initialSelected);
            setSelectAll(true);
        } finally {
            setLoading(false);
        }
    }, []);

   // Trong CartPage.jsx, fetchAvailableVouchers sẽ tự động có shop_id
const fetchAvailableVouchers = useCallback(async () => {
    if (cart.items.length === 0) return;
    
    setVoucherLoading(true);
    try {
        // Lấy shop_id từ item đầu tiên (đã có trong cart data)
        const shopId = cart.items[0]?.shop_id;
        const selectedTotal = getSelectedTotal();
        
        console.log("Fetching vouchers with shop_id:", shopId);
        
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
}, [cart.items, selectedItems]);
    // ==================== HELPER FUNCTIONS ====================
    const getSelectedTotal = useCallback(() => {
        let total = 0;
        cart.items.forEach(item => {
            const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
            if (selectedItems[itemKey]) {
                total += item.subtotal;
            }
        });
        return total;
    }, [cart.items, selectedItems]);

    const calculateDiscount = useCallback(() => {
        if (!selectedVoucher) return 0;
        if (selectedVoucher.discount_type === "percent") {
            return (getSelectedTotal() * selectedVoucher.discount_value) / 100;
        }
        return selectedVoucher.discount_value;
    }, [selectedVoucher, getSelectedTotal]);

    const finalTotal = getSelectedTotal() - calculateDiscount();

    // ==================== EFFECTS ====================
    // 1. Fetch cart when component mounts
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // 2. Fetch vouchers when cart or selected items change
    useEffect(() => {
        if (cart.items.length > 0) {
            fetchAvailableVouchers();
        }
    }, [cart.items, selectedItems, fetchAvailableVouchers]);

    // 3. Debug selected voucher
    useEffect(() => {
        if (selectedVoucher) {
            console.log("Selected Voucher applied:", selectedVoucher);
            console.log("Discount calculation:", {
                total: getSelectedTotal(),
                discount_type: selectedVoucher.discount_type,
                discount_value: selectedVoucher.discount_value,
                calculated_discount: calculateDiscount(),
                finalTotal: finalTotal
            });
        }
    }, [selectedVoucher, getSelectedTotal, calculateDiscount, finalTotal]);

    // ==================== EVENT HANDLERS ====================
    const toggleSelectItem = (productId, variantId) => {
        const itemKey = `${productId}-${variantId || 'no-variant'}`;
        setSelectedItems(prev => {
            const newSelected = { ...prev, [itemKey]: !prev[itemKey] };
            const allSelected = cart.items.every(item => {
                const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                return newSelected[key];
            });
            setSelectAll(allSelected);
            return newSelected;
        });
    };

    const toggleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        
        const newSelected = {};
        cart.items.forEach(item => {
            const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
            newSelected[itemKey] = newSelectAll;
        });
        setSelectedItems(newSelected);
    };

    const updateQuantity = async (productId, variantId, newQuantity) => {
        if (newQuantity < 1) return;
        
        const itemKey = `${productId}-${variantId || 'no-variant'}`;
        const currentItem = cart.items.find(item => 
            item.product_id === productId && 
            (item.variant_id === variantId || (!item.variant_id && !variantId))
        );
        
        if (!currentItem) return;
        
        const oldQuantity = currentItem.quantity;
        const quantityChange = newQuantity - oldQuantity;
        
        if (quantityChange === 0) return;
        
        // Optimistic update
        setCart(prevCart => {
            const updatedItems = prevCart.items.map(item => {
                if (item.product_id === productId && 
                    (item.variant_id === variantId || (!item.variant_id && !variantId))) {
                    const newSubtotal = item.price * newQuantity;
                    return { ...item, quantity: newQuantity, subtotal: newSubtotal };
                }
                return item;
            });
            
            const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
            return {
                items: updatedItems,
                total_price: newTotalPrice
            };
        });
        
        setUpdatingItems(prev => ({ ...prev, [itemKey]: true }));
        
        try {
            await api.post('/api/v1/cart/add', null, {
                params: {
                    product_id: productId,
                    quantity: quantityChange,
                    variant_id: variantId || null
                }
            });
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error("Error updating quantity:", error);
            await fetchCart();
        } finally {
            setUpdatingItems(prev => ({ ...prev, [itemKey]: false }));
        }
    };

    const removeItem = async (productId, variantId) => {
        const itemKey = `${productId}-${variantId || 'no-variant'}`;
        
        // Optimistic update
        setCart(prevCart => {
            const updatedItems = prevCart.items.filter(item => 
                !(item.product_id === productId && 
                  (item.variant_id === variantId || (!item.variant_id && !variantId)))
            );
            const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
            return {
                items: updatedItems,
                total_price: newTotalPrice
            };
        });
        
        setSelectedItems(prev => {
            const newSelected = { ...prev };
            delete newSelected[itemKey];
            return newSelected;
        });
        
        setUpdatingItems(prev => ({ ...prev, [itemKey]: true }));
        
        try {
            await api.delete('/api/v1/cart/remove', {
                params: {
                    product_id: productId,
                    variant_id: variantId || null
                }
            });
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error("Error removing item:", error);
            await fetchCart();
        } finally {
            setUpdatingItems(prev => ({ ...prev, [itemKey]: false }));
        }
    };

    // Trong CartPage.jsx, sửa lại applyVoucher
    const applyVoucher = async () => {
        if (!voucherCode.trim()) {
            showToast("Vui lòng nhập mã giảm giá", "error");
            return;
        }
        
        setApplyingVoucher(true);
        setVoucherError("");
        
        try {
            const shopId = cart.items.length > 0 ? cart.items[0].shop_id : null;
            
            const params = {
                code: voucherCode.toUpperCase(),
                order_total: getSelectedTotal()
            };
            
            if (shopId) {
                params.shop_id = shopId;
            }
            
            const response = await api.post('/api/v1/vouchers/validate', null, {
                params: params
            });
            
            console.log("Validate response:", response);
            console.log("Response data:", response.data);
            
            // Kiểm tra response có discount và voucher không
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
                    usage_limit: response.data.voucher.usage_limit,
                    used_count: response.data.voucher.used_count,
                    target_type: response.data.voucher.target_type,
                    shop_id: response.data.voucher.shop_id,
                    start_date: response.data.voucher.start_date,
                    end_date: response.data.voucher.end_date
                };
                
                setSelectedVoucher(voucherData);
                setVoucherCode(voucherCode.toUpperCase());
                showToast(`Áp dụng mã ${voucherCode.toUpperCase()} thành công! Giảm ${formatCurrency(response.data.discount)}`, "success");
            } 
            // Kiểm tra nếu có lỗi
            else if (response.data && response.data.error) {
                setVoucherError(response.data.error);
                showToast(response.data.error, "error");
            } 
            // Trường hợp không có discount và không có error
            else {
                console.error("Unexpected response structure:", response.data);
                setVoucherError("Không thể áp dụng mã giảm giá");
                showToast("Không thể áp dụng mã giảm giá", "error");
            }
        } catch (error) {
            console.error("Error applying voucher:", error);
            if (error.response?.data?.error) {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const handleCheckout = () => {
        const selectedItemsList = cart.items.filter(item => {
            const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
            return selectedItems[itemKey];
        });
        
        if (selectedItemsList.length === 0) {
            showToast("Vui lòng chọn ít nhất một sản phẩm để thanh toán", "error");
            return;
        }
        
        localStorage.setItem('selectedCartItems', JSON.stringify(selectedItemsList));
        localStorage.setItem('selectedTotal', getSelectedTotal());
        localStorage.setItem('selectedVoucher', JSON.stringify(selectedVoucher));
        localStorage.setItem('finalTotal', finalTotal);
        
        navigate('/checkout');
    };

    // ==================== RENDER ====================
    if (loading) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <FaSpinner className="spinning" size={40} color="#2e7d32" />
                    <p>Đang tải giỏ hàng...</p>
                </div>
            </ShopDetailLayout>
        );
    }

    if (cart.items.length === 0) {
        return (
            <ShopDetailLayout>
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
                    <FaShoppingCart size={80} color="#ccc" />
                    <h2 style={{ marginTop: "20px", color: "#666" }}>Giỏ hàng trống</h2>
                    <p style={{ color: "#999", marginBottom: "30px" }}>Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
                    <button 
                        onClick={() => navigate('/use/shop')}
                        style={{ padding: "12px 32px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}
                    >
                        Tiếp tục mua sắm
                    </button>
                </div>
            </ShopDetailLayout>
        );
    }

    return (
        <ShopDetailLayout>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
                {/* Toast Notification */}
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
                    <span style={{ color: "#333" }}>Giỏ hàng</span>
                </div>

                <h1 style={{ fontSize: "28px", marginBottom: "24px", fontWeight: "600" }}>Giỏ hàng</h1>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px" }}>
                    {/* Left - Cart Items */}
                    <div>
                        {/* Table Header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "0.5fr 3fr 1fr 1fr 1fr 0.5fr",
                            background: "#f8f9fa",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            marginBottom: "16px",
                            fontWeight: "600",
                            color: "#666",
                            fontSize: "14px",
                            alignItems: "center"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={toggleSelectAll}>
                                {selectAll ? (
                                    <FaCheckCircle color="#2e7d32" size={18} />
                                ) : (
                                    <FaRegCheckCircle color="#999" size={18} />
                                )}
                                <span> Tất cả</span>
                            </div>
                            <span>Sản phẩm</span>
                            <span style={{ textAlign: "center" }}>Đơn giá</span>
                            <span style={{ textAlign: "center" }}>Số lượng</span>
                            <span style={{ textAlign: "center" }}>Số tiền</span>
                            <span style={{ textAlign: "center" }}>Thao tác</span>
                        </div>

                        {/* Cart Items */}
                        {cart.items.map((item, index) => {
                            const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                            const isUpdating = updatingItems[itemKey];
                            const isSelected = selectedItems[itemKey];
                            
                            return (
                                <div key={itemKey} style={{
                                    display: "grid",
                                    gridTemplateColumns: "0.5fr 3fr 1fr 1fr 1fr 0.5fr",
                                    alignItems: "center",
                                    padding: "16px",
                                    borderBottom: "1px solid #eee",
                                    background: isSelected ? "#f9fef9" : "white",
                                    transition: "all 0.2s",
                                    opacity: isUpdating ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isSelected ? "#e8f5e9" : "#fafafa"}
                                onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? "#f9fef9" : "white"}>
                                    {/* Checkbox */}
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <button
                                            onClick={() => toggleSelectItem(item.product_id, item.variant_id)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "4px"
                                            }}
                                        >
                                            {isSelected ? (
                                                <FaCheckCircle color="#2e7d32" size={20} />
                                            ) : (
                                                <FaRegCheckCircle color="#999" size={20} />
                                            )}
                                        </button>
                                    </div>

                                    {/* Product Info */}
                                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        <img 
                                            src={item.image_url || "https://via.placeholder.com/80"} 
                                            alt={item.product_name}
                                            style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px" }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: "500", marginBottom: "4px" }}>{item.product_name}</div>
                                            {item.variant_name && (
                                                <span style={{ fontSize: "12px", color: "#999" }}>{item.variant_name}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div style={{ textAlign: "center", fontWeight: "500", color: "#d32f2f" }}>
                                        {formatCurrency(item.price)}
                                    </div>

                                    {/* Quantity */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                                            disabled={isUpdating}
                                            style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "6px",
                                                border: "1px solid #ddd",
                                                background: "white",
                                                cursor: isUpdating ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            <FaMinus size={12} />
                                        </button>
                                        <span style={{ width: "40px", textAlign: "center", fontWeight: "500" }}>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                                            disabled={isUpdating}
                                            style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "6px",
                                                border: "1px solid #ddd",
                                                background: "white",
                                                cursor: isUpdating ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            <FaPlus size={12} />
                                        </button>
                                    </div>

                                    {/* Subtotal */}
                                    <div style={{ textAlign: "center", fontWeight: "600", color: "#d32f2f" }}>
                                        {formatCurrency(item.subtotal)}
                                    </div>

                                    {/* Action */}
                                    <div style={{ textAlign: "center" }}>
                                        <button
                                            onClick={() => removeItem(item.product_id, item.variant_id)}
                                            disabled={isUpdating}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: isUpdating ? "not-allowed" : "pointer",
                                                color: "#dc3545",
                                                fontSize: "16px",
                                                transition: "transform 0.2s"
                                            }}
                                            onMouseEnter={(e) => { if (!isUpdating) e.currentTarget.style.transform = "scale(1.1)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right - Summary */}
                    <div>
                        {/* Voucher Section */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "20px",
                            marginBottom: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                <FaTag color="#2e7d32" />
                                <span style={{ fontWeight: "600" }}>Voucher</span>
                            </div>
                            
                            <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
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
                                    <button onClick={removeVoucher} style={{
                                        padding: "12px 20px",
                                        background: "#dc3545",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}>
                                        Xóa
                                    </button>
                                ) : (
                                    <button onClick={applyVoucher} disabled={applyingVoucher} style={{
                                        padding: "12px 20px",
                                        background: "#2e7d32",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: applyingVoucher ? "not-allowed" : "pointer",
                                        opacity: applyingVoucher ? 0.7 : 1
                                    }}>
                                        {applyingVoucher ? <FaSpinner className="spinning" /> : "Áp dụng"}
                                    </button>
                                )}
                            </div>
                            
                            {voucherError && (
                                <div style={{ fontSize: "12px", color: "#dc3545", marginBottom: "8px" }}>
                                    {voucherError}
                                </div>
                            )}
                            
                            {selectedVoucher && (
                                <div style={{
                                    background: "#e8f5e9",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    marginTop: "8px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <div>
                                        <span style={{ fontWeight: "500", color: "#2e7d32" }}>{selectedVoucher.code}</span>
                                        <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                                            Giảm {selectedVoucher.discount_type === "percent" ? `${selectedVoucher.discount_value}%` : formatCurrency(selectedVoucher.discount_value)}
                                        </span>
                                    </div>
                                    <button onClick={removeVoucher} style={{
                                        background: "none",
                                        border: "none",
                                        color: "#dc3545",
                                        cursor: "pointer",
                                        fontSize: "12px"
                                    }}>
                                        <FaTrash size={12} /> Xóa
                                    </button>
                                </div>
                            )}
                            
                            <button onClick={() => setShowVouchers(!showVouchers)} style={{
                                marginTop: "12px",
                                color: "#2e7d32",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px"
                            }}>
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
                                            // Inside the availableVouchers.map() - fix the onClick handler
                                            onClick={async () => {
                                                try {
                                                    const shopId = cart.items[0]?.shop_id;
                                                    const selectedTotal = getSelectedTotal();
                                                    
                                                    console.log("Applying voucher:", {
                                                        code: v.code,
                                                        order_total: selectedTotal,
                                                        shop_id: shopId
                                                    });
                                                    
                                                    const response = await api.post('/api/v1/vouchers/validate', null, {
                                                        params: {
                                                            code: v.code,
                                                            order_total: selectedTotal,
                                                            shop_id: shopId
                                                        }
                                                    });
                                                    
                                                    console.log("Response from server:", response.data);
                                                    
                                                    if (response.data && response.data.discount !== undefined) {
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
                                            }}>
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

                        {/* Order Summary */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>
                                Thông tin thanh toán
                            </h3>
                            
                            <div style={{ marginBottom: "16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <span style={{ color: "#666" }}>Sản phẩm chọn</span>
                                    <span>{Object.values(selectedItems).filter(Boolean).length} sản phẩm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <span style={{ color: "#666" }}>Tạm tính</span>
                                    <span>{formatCurrency(getSelectedTotal())}</span>
                                </div>
                                {selectedVoucher && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "#2e7d32" }}>
                                        <span>Giảm giá ({selectedVoucher.code})</span>
                                        <span>- {formatCurrency(calculateDiscount())}</span>
                                    </div>
                                )}
                                <div style={{ height: "1px", background: "#eee", margin: "16px 0" }} />
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <span style={{ fontWeight: "600", fontSize: "18px" }}>Thành tiền</span>
                                    <span style={{ fontWeight: "bold", fontSize: "24px", color: "#d32f2f" }}>
                                        {formatCurrency(finalTotal)}
                                    </span>
                                </div>
                            </div>

                            <button onClick={handleCheckout} style={{
                                width: "100%",
                                padding: "14px",
                                background: "#2e7d32",
                                color: "white",
                                border: "none",
                                borderRadius: "40px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.3s"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#1b5e20"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                Thanh toán
                            </button>

                            <button onClick={() => navigate('/use/shop')} style={{
                                width: "100%",
                                marginTop: "12px",
                                padding: "12px",
                                background: "white",
                                color: "#2e7d32",
                                border: "2px solid #2e7d32",
                                borderRadius: "40px",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                                <FaArrowLeft style={{ marginRight: "8px" }} /> Tiếp tục mua sắm
                            </button>
                        </div>

                        {/* Delivery Info */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "16px",
                            marginTop: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                <FaTruck color="#2e7d32" />
                                <span style={{ fontSize: "14px", fontWeight: "500" }}>Thông tin vận chuyển</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.5" }}>
                                Giao hàng toàn quốc, thời gian giao 2-3 ngày làm việc.
                                Miễn phí vận chuyển cho đơn hàng từ 200.000đ.
                            </p>
                        </div>
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
                @keyframes toastFadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); visibility: hidden; }
                }
            `}</style>
        </ShopDetailLayout>
    );
};

export default CartPage;