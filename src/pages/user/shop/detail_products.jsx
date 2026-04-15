// pages/user/product/ProductDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import api from "../../../api/api";
import { 
  FaStar, 
  FaStarHalfAlt,
  FaRegStar,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaShoppingCart,
  FaBox,
  FaTag,
  FaStore,
  FaQrcode,
  FaDownload,
  FaShareAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaTruck,
  FaShieldAlt,
  FaClock,
  FaUser,
  FaHeart,
  FaRegHeart,
  FaTimes
} from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";

const ProductDetailPage = () => {
    const { product_id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [shop, setShop] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [activeTab, setActiveTab] = useState("description"); 
    const [addingToCart, setAddingToCart] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
        if (product_id) {
            fetchProductDetail();
        }
    }, [product_id]);

    const fetchProductDetail = async () => {
        setLoading(true);
        try {
            // Lấy chi tiết sản phẩm
            const productRes = await api.get(`/api/v1/products/${product_id}`);
            console.log("Product data:", productRes.data);
            console.log("Product shop_id:", productRes.data.shop_id);
            
            setProduct(productRes.data);
            
            // Lấy thông tin shop
            if (productRes.data.shop_id) {
                const shopRes = await api.get(`/api/v1/shops/${productRes.data.shop_id}`);
                setShop(shopRes.data);
                
                // Lấy sản phẩm tương tự từ cùng shop
                try {
                    const shopProductsRes = await api.get(`/api/v1/shops/${productRes.data.shop_id}/products`);
                    // Lọc bỏ sản phẩm hiện tại và giới hạn 4 sản phẩm
                    const otherProducts = (shopProductsRes.data || [])
                        .filter(p => p.id !== product_id && p.id !== productRes.data.id)
                        .slice(0, 4);
                    setRelatedProducts(otherProducts);
                } catch (relatedError) {
                    console.error("Error fetching related products:", relatedError);
                    setRelatedProducts([]);
                }
            }
            
            // Set variant mặc định nếu có
            if (productRes.data.variants && productRes.data.variants.length > 0) {
                setSelectedVariant(productRes.data.variants[0]);
            }
        } catch (error) {
            console.error("Error fetching product detail:", error);
            setProduct(null);
            setRelatedProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Không rõ";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) stars.push(<FaStar key={i} style={{ color: "#ffc107" }} />);
            else if (i === fullStars + 1 && hasHalfStar) stars.push(<FaStarHalfAlt key={i} style={{ color: "#ffc107" }} />);
            else stars.push(<FaRegStar key={i} style={{ color: "#ddd" }} />);
        }
        return stars;
    };

    const handleAddToCart = async () => {
        setAddingToCart(true);
        try {
            const shopId = product.shop_id;
            
            console.log("Adding to cart with shop_id:", shopId);
            
            const response = await api.post('/api/v1/cart/add', null, {
                params: {
                    product_id: product.id,
                    quantity: quantity,
                    variant_id: selectedVariant?.id || null,
                    shop_id: shopId
                }
            });
            
            const itemName = selectedVariant 
                ? `${product.name} - ${selectedVariant.name}` 
                : product.name;
            
            showToast(`Đã thêm ${quantity} ${itemName} vào giỏ hàng!`, 'success');
            
            window.dispatchEvent(new Event('cartUpdated'));
            
        } catch (error) {
            console.error("Error adding to cart:", error);
            if (error.response) {
                showToast(error.response.data.detail || "Có lỗi xảy ra", "error");
            } else {
                showToast("Có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại!", "error");
            }
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = () => {
        handleAddToCart();
        setTimeout(() =>{
            navigate('/cart');
        }, 500)
    };

    const handleShopClick = () => {
        navigate(`/shop/${shop?.id}`);
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `qr-${product?.name || 'product'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    if (loading) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ width: "50px", height: "50px", border: "3px solid #f3f3f3", borderTop: "3px solid #4CAF50", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                    <p>Đang tải thông tin sản phẩm...</p>
                </div>
            </ShopDetailLayout>
        );
    }

    if (!product) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h2>Không tìm thấy sản phẩm</h2>
                    <button onClick={() => navigate('/shop')} style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}>Quay lại</button>
                </div>
            </ShopDetailLayout>
        );
    }

    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

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
                                background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 20px rgba(46,125,50,0.3)"
                            }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            
                            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2e7d32", marginBottom: "8px" }}>
                                Thành công!
                            </div>
                            <div style={{ fontSize: "16px", color: "#666", lineHeight: "1.5" }}>
                                {toast.message}
                            </div>
                            
                            <div style={{
                                width: "60px",
                                height: "3px",
                                background: "linear-gradient(90deg, #2e7d32, #4caf50, #2e7d32)",
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
                    <span style={{ cursor: "pointer", color: "#2e7d32" }} onClick={() => navigate('/shop')}>Cửa hàng</span>
                    <span style={{ margin: "0 8px" }}>›</span>
                    <span style={{ color: "#333" }}>{product.name}</span>
                </div>

                {/* Product Main Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "48px" }}>
                    {/* Left - Image */}
                    <div>
                        <div style={{
                            background: "white",
                            borderRadius: "24px",
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            position: "relative"
                        }}>
                            <img 
                                src={product.image_url || "https://via.placeholder.com/600"} 
                                alt={product.name}
                                style={{ width: "100%", height: "auto", objectFit: "cover" }}
                            />
                            {product.qr_code_url && (
                                <button 
                                    onClick={() => setShowQRModal(true)}
                                    style={{
                                        position: "absolute",
                                        bottom: "16px",
                                        right: "16px",
                                        background: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "48px",
                                        height: "48px",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    <FaQrcode size={24} color="#2e7d32" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right - Info */}
                    <div>
                        <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#333" }}>{product.name}</h1>
                        
                        {/* Rating */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", gap: "2px" }}>{renderStars(product.rating || 4.5)}</div>
                            <span style={{ color: "#666" }}>({product.total_reviews || 0} đánh giá)</span>
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: "20px" }}>
                            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#d32f2f" }}>{formatCurrency(currentPrice)}</span>
                            {selectedVariant && product.price !== selectedVariant.price && (
                                <span style={{ fontSize: "18px", color: "#999", textDecoration: "line-through", marginLeft: "12px" }}>
                                    {formatCurrency(product.price)}
                                </span>
                            )}
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Đơn vị:</label>
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                    {product.variants.map(variant => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            style={{
                                                padding: "10px 20px",
                                                border: selectedVariant?.id === variant.id ? "2px solid #2e7d32" : "1px solid #ddd",
                                                background: selectedVariant?.id === variant.id ? "#e8f5e9" : "white",
                                                borderRadius: "40px",
                                                cursor: "pointer",
                                                fontWeight: selectedVariant?.id === variant.id ? "600" : "400",
                                                color: selectedVariant?.id === variant.id ? "#2e7d32" : "#333"
                                            }}
                                        >
                                            {variant.name} - {formatCurrency(variant.price)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Số lượng:</label>
                            
                            <style>
                                {`
                                    .hide-arrows::-webkit-inner-spin-button, 
                                    .hide-arrows::-webkit-outer-spin-button { 
                                        -webkit-appearance: none; 
                                        margin: 0; 
                                    }
                                    .hide-arrows {
                                        -moz-appearance: textfield;
                                    }
                                `}
                            </style>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}
                                >-</button>
                                <input 
                                    type="number" 
                                    className="hide-arrows"
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Math.min(currentStock, Math.max(1, parseInt(e.target.value) || 1)))}
                                    style={{ 
                                        width: "60px", 
                                        textAlign: "center", 
                                        padding: "8px", 
                                        border: "1px solid #ddd", 
                                        borderRadius: "8px",
                                        fontSize: "16px",
                                        fontWeight: "500"
                                    }}
                                />
                                <button 
                                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                    style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}
                                >+</button>
                                <span style={{ color: "#666", fontSize: "14px" }}>{currentStock} sản phẩm có sẵn</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
                    <button 
                        onClick={handleAddToCart}
                        disabled={addingToCart || currentStock === 0}
                        style={{
                            flex: 1,
                            padding: "14px",
                            background: currentStock === 0 ? "#ccc" : (addingToCart ? "#f5f5f5" : "#f5f5f5"),
                            color: currentStock === 0 ? "#999" : (addingToCart ? "#999" : "#2e7d32"),
                            border: currentStock === 0 ? "1px solid #ccc" : "2px solid #2e7d32",
                            borderRadius: "40px",
                            fontWeight: "600",
                            cursor: (addingToCart || currentStock === 0) ? "not-allowed" : "pointer",
                            transition: "all 0.3s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            opacity: addingToCart ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => { 
                            if (!addingToCart && currentStock > 0) {
                                e.currentTarget.style.background = "#2e7d32"; 
                                e.currentTarget.style.color = "white"; 
                            }
                        }}
                        onMouseLeave={(e) => { 
                            if (!addingToCart && currentStock > 0) {
                                e.currentTarget.style.background = "#f5f5f5"; 
                                e.currentTarget.style.color = "#2e7d32"; 
                            }
                        }}
                    >
                        {addingToCart ? (
                            <>
                                <div style={{ 
                                    width: "18px", 
                                    height: "18px", 
                                    border: "2px solid #2e7d32", 
                                    borderTop: "2px solid transparent", 
                                    borderRadius: "50%", 
                                    animation: "spin 0.8s linear infinite" 
                                }} />
                                Đang thêm...
                            </>
                        ) : (
                            <>
                                <FaShoppingCart /> 
                                {currentStock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                            </>
                        )}
                    </button>
                    <button 
                        onClick={handleBuyNow}
                        disabled={currentStock === 0}
                        style={{
                            flex: 1,
                            padding: "14px",
                            background: currentStock === 0 ? "#ccc" : "#2e7d32",
                            color: currentStock === 0 ? "#999" : "white",
                            border: "none",
                            borderRadius: "40px",
                            fontWeight: "600",
                            cursor: currentStock === 0 ? "not-allowed" : "pointer",
                            transition: "all 0.3s",
                            opacity: currentStock === 0 ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => { 
                            if (currentStock > 0) {
                                e.currentTarget.style.background = "#1b5e20"; 
                                e.currentTarget.style.transform = "translateY(-2px)"; 
                            }
                        }}
                        onMouseLeave={(e) => { 
                            if (currentStock > 0) {
                                e.currentTarget.style.background = "#2e7d32"; 
                                e.currentTarget.style.transform = "translateY(0)"; 
                            }
                        }}
                    >
                        Mua ngay
                    </button>
                    <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        style={{
                            width: "52px",
                            padding: "14px",
                            background: "white",
                            border: "1px solid #ddd",
                            borderRadius: "40px",
                            cursor: "pointer",
                            transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ddd"; }}
                    >
                        {isFavorite ? <FaHeart color="#ff4444" size={20} /> : <FaRegHeart size={20} />}
                    </button>
                    <div style={{ position: "relative" }}>
                        <button 
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            style={{
                                width: "52px",
                                padding: "14px",
                                background: "white",
                                border: "1px solid #ddd",
                                borderRadius: "40px",
                                cursor: "pointer"
                            }}
                        >
                            <FaShareAlt />
                        </button>
                        {showShareMenu && (
                            <div style={{ position: "absolute", top: "55px", right: 0, background: "white", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "8px", zIndex: 10, minWidth: "160px" }}>
                                <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaFacebook color="#1877f2" size={18} /> Facebook</button>
                                <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaTwitter color="#1da1f2" size={18} /> Twitter</button>
                                <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaInstagram color="#e4405f" size={18} /> Instagram</button>
                            </div>
                        )}
                    </div>
                        </div>


                        {/* Product Highlights */}
                        <div style={{ background: "#f8f9fa", borderRadius: "16px", padding: "20px", marginTop: "24px" }}>
                            <h4 style={{ marginBottom: "16px", fontSize: "16px" }}>Thông tin nổi bật</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><FaTruck color="#2e7d32" /> Giao hàng toàn quốc</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><FaShieldAlt color="#2e7d32" /> Đảm bảo chất lượng</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><FaClock color="#2e7d32" /> Giao hàng trong 2-3 ngày</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div style={{ marginBottom: "48px" }}>
                    <div style={{ display: "flex", gap: "32px", borderBottom: "2px solid #eee", marginBottom: "24px" }}>
                        {[
                            { id: "description", label: "Mô tả sản phẩm" },
                            { id: "specifications", label: "Thông tin chi tiết" },
                            { id: "origin", label: "Nguồn gốc" },
                            { id: "shop", label: "Thông tin shop" }
                        ].map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: "12px 0",
                                    background: "none",
                                    border: "none",
                                    fontSize: "16px",
                                    fontWeight: activeTab === tab.id ? "600" : "400",
                                    color: activeTab === tab.id ? "#2e7d32" : "#666",
                                    borderBottom: activeTab === tab.id ? "3px solid #2e7d32" : "none",
                                    cursor: "pointer"
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ background: "white", borderRadius: "20px", padding: "32px" }}>
                        {activeTab === "description" && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Mô tả sản phẩm</h3>
                                <p style={{ lineHeight: "1.8", color: "#555" }}>{product.description || "Chưa có mô tả sản phẩm"}</p>
                            </div>
                        )}

                        {activeTab === "specifications" && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Thông số kỹ thuật</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Xuất xứ:</span>
                                        <span style={{ fontWeight: "500" }}>{product.origin || "Chưa cập nhật"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Chứng nhận:</span>
                                        <span style={{ fontWeight: "500" }}>{product.certification || "Chưa có"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Đơn vị tính:</span>
                                        <span style={{ fontWeight: "500" }}>{selectedVariant?.name || "Sản phẩm"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                                        <span style={{ color: "#666" }}>Ngày đăng:</span>
                                        <span style={{ fontWeight: "500" }}>{formatDate(product.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "origin" && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Nguồn gốc xuất xứ</h3>
                                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ lineHeight: "1.8", color: "#555", marginBottom: "16px" }}>
                                            Sản phẩm được trồng tại {product.origin || "vùng nguyên liệu đạt chuẩn"}, 
                                            với quy trình canh tác an toàn, không sử dụng hóa chất độc hại.
                                        </p>
                                        <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "12px" }}>
                                            <strong>Chứng nhận:</strong>
                                            <p style={{ marginTop: "8px", color: "#555" }}>{product.certification || "Đang cập nhật"}</p>
                                        </div>
                                    </div>
                                    {product.qr_code_url && (
                                        <div style={{ textAlign: "center", padding: "20px", background: "#f8f9fa", borderRadius: "16px", minWidth: "200px" }}>
                                            <FaQrcode size={48} color="#2e7d32" />
                                            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Quét mã để truy xuất nguồn gốc</p>
                                            <button 
                                                onClick={() => setShowQRModal(true)}
                                                style={{ marginTop: "12px", padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}
                                            >
                                                Xem QR Code
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "shop" && shop && (
                            <div>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Thông tin cửa hàng</h3>
                                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: "16px" }}>
                                            <h4 style={{ fontSize: "20px", color: "#2e7d32", cursor: "pointer" }} onClick={handleShopClick}>{shop.name}</h4>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                                <div style={{ display: "flex", gap: "2px" }}>{renderStars(shop.rating || 4.5)}</div>
                                                <span>({shop.followers_count || 0} người theo dõi)</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#555" }}><FaMapMarkerAlt color="#2e7d32" /> {shop.address || "Chưa cập nhật"}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#555" }}><FaPhone color="#2e7d32" /> {shop.phone || "Chưa cập nhật"}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#555" }}><FaEnvelope color="#2e7d32" /> {shop.email || "Chưa cập nhật"}</div>
                                        </div>
                                        <button 
                                            onClick={handleShopClick}
                                            style={{ marginTop: "20px", padding: "10px 24px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}
                                        >
                                            Xem cửa hàng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600" }}>Sản phẩm tương tự</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                            {relatedProducts.map(relatedProduct => (
                                <div 
                                    key={relatedProduct.id} 
                                    onClick={() => handleProductClick(relatedProduct.id)}
                                    style={{ 
                                        background: "white", 
                                        borderRadius: "16px", 
                                        overflow: "hidden", 
                                        cursor: "pointer", 
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)", 
                                        transition: "transform 0.3s" 
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    <img 
                                        src={relatedProduct.image_url || "https://via.placeholder.com/300"} 
                                        alt={relatedProduct.name}
                                        style={{ width: "100%", height: "180px", objectFit: "cover" }} 
                                    />
                                    <div style={{ padding: "12px" }}>
                                        <h4 style={{ fontSize: "14px", marginBottom: "8px", fontWeight: "600", color: "#333" }}>{relatedProduct.name}</h4>
                                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                                            {renderStars(relatedProduct.rating || 4.5)}
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#d32f2f" }}>{formatCurrency(relatedProduct.price)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowQRModal(false)}>
                    <div style={{ background: "white", borderRadius: "24px", padding: "32px", maxWidth: "400px", width: "90%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: "20px" }}>QR Code truy xuất nguồn gốc</h3>
                        {product.qr_code_url ? (
                            <img src={`http://localhost:8000/${product.qr_code_url}`} alt="QR Code" style={{ width: "200px", height: "200px", margin: "0 auto 20px" }} />
                        ) : (
                            <QRCodeCanvas 
                                id="qr-code-canvas"
                                value={`http://localhost:5173/product/${product.id}/trace`}
                                size={200}
                                level="H"
                                includeMargin={true}
                                style={{ margin: "0 auto 20px" }}
                            />
                        )}
                        <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
                            Quét mã QR để xem thông tin truy xuất nguồn gốc sản phẩm
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button 
                                onClick={handleDownloadQR}
                                style={{ padding: "10px 20px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                <FaDownload /> Tải QR
                            </button>
                            <button 
                                onClick={() => setShowQRModal(false)}
                                style={{ padding: "10px 20px", background: "#f5f5f5", border: "none", borderRadius: "30px", cursor: "pointer" }}
                            >
                                Đóng
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
                
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    opacity: 1;
                }
                
                .hide-arrows::-webkit-inner-spin-button, 
                .hide-arrows::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .hide-arrows {
                    -moz-appearance: textfield;
                }
            `}</style>
        </ShopDetailLayout>
    );
};

export default ProductDetailPage;