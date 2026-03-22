// pages/user/cart/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
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
  FaRegCheckCircle
} from 'react-icons/fa';
import ShopDetailLayout from "../../components/layout/ShopDetailLayout";

const CartPage = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState({ items: [], total_price: 0 });
    const [loading, setLoading] = useState(true);
    const [updatingItems, setUpdatingItems] = useState({});
    const [selectedItems, setSelectedItems] = useState({}); // State lưu các item được chọn
    const [selectAll, setSelectAll] = useState(true); // State chọn tất cả
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [showVouchers, setShowVouchers] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");

    const vouchers = [
        { id: 1, code: "GIAM10K", discount: 10000, min_order: 50000, expiry: "2024-12-31" },
        { id: 2, code: "GIAM20K", discount: 20000, min_order: 100000, expiry: "2024-12-31" },
        { id: 3, code: "FREESHIP", discount: 30000, min_order: 150000, expiry: "2024-12-31", type: "shipping" },
        { id: 4, code: "SALE10", discount: 10, type: "percent", min_order: 200000, expiry: "2024-12-31" }
    ];

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/cart');
            const cartData = response.data;
            setCart(cartData);
            
            // Khởi tạo selectedItems: mặc định chọn tất cả
            const initialSelected = {};
            cartData.items.forEach(item => {
                const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                initialSelected[itemKey] = true;
            });
            setSelectedItems(initialSelected);
            setSelectAll(true);
        } catch (error) {
            console.error("Error fetching cart:", error);
            const mockCart = {
                items: [
                    {
                        product_id: "1",
                        product_name: "Bơ tươi, trồng tại vườn",
                        quantity: 1,
                        price: 10000,
                        image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=100",
                        variant_name: "1kg",
                        subtotal: 10000
                    },
                    {
                        product_id: "2",
                        product_name: "Bơ tươi, trồng tại vườn",
                        quantity: 2,
                        price: 20000,
                        image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=100",
                        variant_name: "2kg",
                        subtotal: 40000
                    },
                    {
                        product_id: "3",
                        product_name: "Bơ tươi, trồng tại vườn",
                        quantity: 1,
                        price: 15000,
                        image_url: "https://images.unsplash.com/photo-1584308666744-00d6d8b9f8f8?w=100",
                        variant_name: "500g",
                        subtotal: 15000
                    }
                ],
                total_price: 65000
            };
            setCart(mockCart);
            
            const initialSelected = {};
            mockCart.items.forEach(item => {
                const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                initialSelected[itemKey] = true;
            });
            setSelectedItems(initialSelected);
            setSelectAll(true);
        } finally {
            setLoading(false);
        }
    };

    // Tính tổng tiền của các sản phẩm được chọn
    const getSelectedTotal = () => {
        let total = 0;
        cart.items.forEach(item => {
            const itemKey = `${item.product_id}-${item.variant_id || 'no-variant'}`;
            if (selectedItems[itemKey]) {
                total += item.subtotal;
            }
        });
        return total;
    };

    // Tính giảm giá dựa trên tổng tiền của sản phẩm được chọn
    const calculateDiscount = () => {
        const selectedTotal = getSelectedTotal();
        if (!selectedVoucher) return 0;
        if (selectedVoucher.type === "percent") {
            return (selectedTotal * selectedVoucher.discount) / 100;
        }
        return selectedVoucher.discount;
    };

    const finalTotal = getSelectedTotal() - calculateDiscount();

    // Xử lý chọn/bỏ chọn một item
    const toggleSelectItem = (productId, variantId) => {
        const itemKey = `${productId}-${variantId || 'no-variant'}`;
        setSelectedItems(prev => {
            const newSelected = { ...prev, [itemKey]: !prev[itemKey] };
            // Kiểm tra xem có phải tất cả đều được chọn không
            const allSelected = cart.items.every(item => {
                const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                return newSelected[key];
            });
            setSelectAll(allSelected);
            return newSelected;
        });
    };

    // Xử lý chọn tất cả
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
        
        // Xóa khỏi selectedItems
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

    const applyVoucher = () => {
        const selectedTotal = getSelectedTotal();
        const voucher = vouchers.find(v => v.code === voucherCode.toUpperCase());
        if (voucher) {
            if (selectedTotal >= voucher.min_order) {
                setSelectedVoucher(voucher);
                alert(`Áp dụng mã ${voucher.code} thành công!`);
            } else {
                alert(`Đơn hàng tối thiểu ${formatCurrency(voucher.min_order)} để áp dụng mã này`);
            }
        } else {
            alert("Mã giảm giá không hợp lệ");
        }
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
            alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
            return;
        }
        
        // Lưu thông tin sản phẩm được chọn vào localStorage hoặc state để chuyển sang trang thanh toán
        localStorage.setItem('selectedCartItems', JSON.stringify(selectedItemsList));
        localStorage.setItem('selectedTotal', getSelectedTotal());
        localStorage.setItem('selectedVoucher', JSON.stringify(selectedVoucher));
        localStorage.setItem('finalTotal', finalTotal);
        
        navigate('/checkout');
    };

    if (loading) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ width: "50px", height: "50px", border: "3px solid #f3f3f3", borderTop: "3px solid #4CAF50", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
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
                        onClick={() => navigate('/shop')}
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
                        {/* Table Header với checkbox chọn tất cả */}
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
                                                cursor: isUpdating ? "not-allowed" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
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
                                                cursor: isUpdating ? "not-allowed" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
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
                                                transition: "transform 0.2s",
                                                opacity: isUpdating ? 0.5 : 1
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
                            
                            <div style={{ display: "flex", gap: "12px" }}>
                                <input
                                    type="text"
                                    placeholder="Nhập mã giảm giá"
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        outline: "none"
                                    }}
                                />
                                <button 
                                    onClick={applyVoucher}
                                    style={{
                                        padding: "12px 20px",
                                        background: "#2e7d32",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Áp dụng
                                </button>
                            </div>
                            
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
                                    {vouchers.map(v => (
                                        <div key={v.id} style={{
                                            padding: "10px",
                                            marginBottom: "8px",
                                            background: selectedVoucher?.id === v.id ? "#e8f5e9" : "#f8f9fa",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            transition: "background 0.2s",
                                            border: selectedVoucher?.id === v.id ? "1px solid #2e7d32" : "none"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#e8f5e9"}
                                        onMouseLeave={(e) => {
                                            if (selectedVoucher?.id !== v.id) {
                                                e.currentTarget.style.background = "#f8f9fa";
                                            }
                                        }}
                                        onClick={() => {
                                            const selectedTotal = getSelectedTotal();
                                            if (selectedTotal >= v.min_order) {
                                                setSelectedVoucher(v);
                                                setVoucherCode(v.code);
                                            } else {
                                                alert(`Đơn hàng tối thiểu ${formatCurrency(v.min_order)} để áp dụng mã này`);
                                            }
                                        }}>
                                            <div style={{ fontWeight: "500", fontSize: "14px" }}>{v.code}</div>
                                            <div style={{ fontSize: "12px", color: "#666" }}>
                                                Giảm {v.type === "percent" ? `${v.discount}%` : formatCurrency(v.discount)}
                                                {v.min_order && ` cho đơn từ ${formatCurrency(v.min_order)}`}
                                            </div>
                                        </div>
                                    ))}
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
                                    <span>{cart.items.filter(item => {
                                        const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
                                        return selectedItems[key];
                                    }).length} sản phẩm</span>
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

                            {/* Action Buttons */}
                            <button 
                                onClick={handleCheckout}
                                style={{
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
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.transform = "translateY(0)"; }}
                            >
                                Thanh toán
                            </button>

                            <button 
                                onClick={() => navigate('/shop')}
                                style={{
                                    width: "100%",
                                    marginTop: "12px",
                                    padding: "14px",
                                    background: "white",
                                    color: "#2e7d32",
                                    border: "2px solid #2e7d32",
                                    borderRadius: "40px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.3s"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                            >
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
            `}</style>
        </ShopDetailLayout>
    );
};

export default CartPage;