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
  FaTimes,
  FaCertificate,
  FaCheckCircle,
  FaLeaf,
  FaIndustry,
  FaShippingFast,
  FaWarehouse,
  FaCogs
} from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import ShopDetailLayout from "../../../components/layout/ShopDetailLayout";

const ProductDetailPage = () => {
    const { product_id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [shop, setShop] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [traceability, setTraceability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [activeTab, setActiveTab] = useState("description"); 
    const [addingToCart, setAddingToCart] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

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
        if (product_id && product_id !== 'undefined') {
            fetchProductDetail();
            fetchTraceability();
            checkFavoriteStatus();
            getFavoriteCount();            
        }
    }, [product_id]);

    const fetchTraceability = async () => {
        if (!product_id || product_id === 'undefined') {
            console.log("Invalid product_id for traceability:", product_id);
            setTraceability(null);
            return;
        }
        
        try {
            console.log("Fetching traceability for product_id:", product_id);
            const response = await api.get(`/api/v1/traceability/products/${product_id}`);
            console.log("Traceability response:", response.data);
            
            const data = response.data;
            const hasTraceability = data.has_traceability === true || 
                                   (data.trace_events && Array.isArray(data.trace_events) && data.trace_events.length > 0);
            
            setTraceability({
                ...data,
                has_traceability: hasTraceability,
                trace_events: data.trace_events || []
            });
        } catch (error) {
            console.error("Error fetching traceability:", error);
            setTraceability(null);
        }
    };

    const fetchProductDetail = async () => {
        setLoading(true);
        try {
            const productRes = await api.get(`/api/v1/products/${product_id}`);
            console.log("Product data:", productRes.data);
            
            setProduct(productRes.data);
            
            if (productRes.data.shop_id) {
                const shopRes = await api.get(`/api/v1/shops/${productRes.data.shop_id}`);
                setShop(shopRes.data);
                
                try {
                    const shopProductsRes = await api.get(`/api/v1/shops/${productRes.data.shop_id}/products`);
                    const otherProducts = (shopProductsRes.data || [])
                        .filter(p => {
                            const productId = p.id || p._id;
                            return productId !== product_id && productId !== (productRes.data.id || productRes.data._id);
                        })
                        .map(p => ({
                            ...p,
                            id: p.id || p._id
                        }))
                        .slice(0, 4);
                    setRelatedProducts(otherProducts);
                    console.log("Related products:", otherProducts);
                } catch (relatedError) {
                    console.error("Error fetching related products:", relatedError);
                    setRelatedProducts([]);
                }
            }
            
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

    const checkFavoriteStatus = async () => {
        try {
            const token = localStorage.getItem('user_token');
            if (!token) return;
            
            const response = await api.get(`/api/v1/favorites/check/${product_id}`);
            setIsFavorite(response.data.is_favorite);
        } catch (error) {
            console.error("Error checking favorite status:", error);
            setIsFavorite(false);
        }
    };

    const getFavoriteCount = async () => {
        try {
            const response = await api.get(`/api/v1/favorites/count/${product_id}`);
            setFavoriteCount(response.data.favorite_count);
        } catch (error) {
            console.error("Error getting favorite count:", error);
            setFavoriteCount(0);
        }
    };

    const handleToggleFavorite = async () => {
        const token = localStorage.getItem('user_token');
        
        if (!token) {
            // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
            if (window.confirm('Bạn cần đăng nhập để sử dụng tính năng này. Đăng nhập ngay?')) {
                navigate('/login');
            }
            return;
        }
        
        setFavoriteLoading(true);
        
        try {
            if (isFavorite) {
                // Xóa khỏi yêu thích
                await api.delete(`/api/v1/favorites/${product_id}`);
                setIsFavorite(false);
                setFavoriteCount(prev => Math.max(0, prev - 1));
                showToast('Đã xóa khỏi danh sách yêu thích', 'success');
            } else {
                // Thêm vào yêu thích
                await api.post(`/api/v1/favorites/${product_id}`);
                setIsFavorite(true);
                setFavoriteCount(prev => prev + 1);
                showToast('Đã thêm vào danh sách yêu thích', 'success');
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            if (error.response) {
                showToast(error.response.data.detail || 'Có lỗi xảy ra', 'error');
            } else {
                showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
            }
        } finally {
            setFavoriteLoading(false);
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
            
            await api.post('/api/v1/cart/add', null, {
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
        if (productId && productId !== 'undefined') {
            navigate(`/product/${productId}`);
        }
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

    const getStageIcon = (stage) => {
        const icons = {
            cultivation: <FaLeaf />,
            production: <FaIndustry />,
            processing: <FaCogs />,
            transportation: <FaShippingFast />,
            distribution: <FaWarehouse />,
            certification: <FaCertificate />
        };
        return icons[stage] || <FaCheckCircle />;
    };

    const getStageName = (stage) => {
        const names = {
            cultivation: "Nuôi trồng",
            production: "Sản xuất",
            processing: "Chế biến",
            transportation: "Vận chuyển",
            distribution: "Phân phối",
            certification: "Kiểm định"
        };
        return names[stage] || stage;
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
    const hasTraceability = traceability && traceability.trace_events && traceability.trace_events.length > 0;

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
                            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2e7d32", marginBottom: "8px" }}>Thành công!</div>
                            <div style={{ fontSize: "16px", color: "#666", lineHeight: "1.5" }}>{toast.message}</div>
                            <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg, #2e7d32, #4caf50, #2e7d32)", margin: "20px auto 0", borderRadius: "3px" }} />
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
                        </div>
                    </div>

                    {/* Right - Info */}
                    <div>
                        <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#333" }}>{product.name}</h1>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", gap: "2px" }}>{renderStars(product.rating || 4.5)}</div>
                            <span style={{ color: "#666" }}>({product.total_reviews || 0} đánh giá)</span>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#d32f2f" }}>{formatCurrency(currentPrice)}</span>
                            {selectedVariant && product.price !== selectedVariant.price && (
                                <span style={{ fontSize: "18px", color: "#999", textDecoration: "line-through", marginLeft: "12px" }}>
                                    {formatCurrency(product.price)}
                                </span>
                            )}
                        </div>

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

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Số lượng:</label>
                            <style>{`
                                .hide-arrows::-webkit-inner-spin-button, 
                                .hide-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                                .hide-arrows { -moz-appearance: textfield; }
                            `}</style>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>-</button>
                                <input type="number" className="hide-arrows" value={quantity} onChange={(e) => setQuantity(Math.min(currentStock, Math.max(1, parseInt(e.target.value) || 1)))} style={{ width: "60px", textAlign: "center", padding: "8px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px", fontWeight: "500" }} />
                                <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>+</button>
                                <span style={{ color: "#666", fontSize: "14px" }}>{currentStock} sản phẩm có sẵn</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
                            <button onClick={handleAddToCart} disabled={addingToCart || currentStock === 0} style={{ flex: 1, padding: "14px", background: currentStock === 0 ? "#ccc" : (addingToCart ? "#f5f5f5" : "#f5f5f5"), color: currentStock === 0 ? "#999" : (addingToCart ? "#999" : "#2e7d32"), border: currentStock === 0 ? "1px solid #ccc" : "2px solid #2e7d32", borderRadius: "40px", fontWeight: "600", cursor: (addingToCart || currentStock === 0) ? "not-allowed" : "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: addingToCart ? 0.7 : 1 }}
                                onMouseEnter={(e) => { if (!addingToCart && currentStock > 0) { e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.color = "white"; } }}
                                onMouseLeave={(e) => { if (!addingToCart && currentStock > 0) { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.color = "#2e7d32"; } }}>
                                {addingToCart ? (<> <div style={{ width: "18px", height: "18px", border: "2px solid #2e7d32", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Đang thêm...</>) : (<> <FaShoppingCart /> {currentStock === 0 ? "Hết hàng" : "Thêm vào giỏ"} </>)}
                            </button>
                            <button onClick={handleBuyNow} disabled={currentStock === 0} style={{ flex: 1, padding: "14px", background: currentStock === 0 ? "#ccc" : "#2e7d32", color: currentStock === 0 ? "#999" : "white", border: "none", borderRadius: "40px", fontWeight: "600", cursor: currentStock === 0 ? "not-allowed" : "pointer", transition: "all 0.3s", opacity: currentStock === 0 ? 0.6 : 1 }}
                                onMouseEnter={(e) => { if (currentStock > 0) { e.currentTarget.style.background = "#1b5e20"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                                onMouseLeave={(e) => { if (currentStock > 0) { e.currentTarget.style.background = "#2e7d32"; e.currentTarget.style.transform = "translateY(0)"; } }}>Mua ngay</button>
                            
                             <button 
        onClick={handleToggleFavorite} 
        disabled={favoriteLoading}
        style={{
            width: "52px",
            padding: "14px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "40px",
            cursor: favoriteLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            opacity: favoriteLoading ? 0.6 : 1
        }}
        onMouseEnter={(e) => { if (!favoriteLoading) e.currentTarget.style.borderColor = "#ff4444"; }}
        onMouseLeave={(e) => { if (!favoriteLoading) e.currentTarget.style.borderColor = "#ddd"; }}
    >
        {favoriteLoading ? (
            <div style={{ width: "20px", height: "20px", border: "2px solid #ff4444", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        ) : (
            isFavorite ? <FaHeart color="#ff4444" size={20} /> : <FaRegHeart size={20} />
        )}
    </button>    
                            
                            <div style={{ position: "relative" }}>
                                <button onClick={() => setShowShareMenu(!showShareMenu)} style={{ width: "52px", padding: "14px", background: "white", border: "1px solid #ddd", borderRadius: "40px", cursor: "pointer" }}><FaShareAlt /></button>
                                {showShareMenu && (
                                    <div style={{ position: "absolute", top: "55px", right: 0, background: "white", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "8px", zIndex: 10, minWidth: "160px" }}>
                                        <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaFacebook color="#1877f2" size={18} /> Facebook</button>
                                        <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaTwitter color="#1da1f2" size={18} /> Twitter</button>
                                        <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><FaInstagram color="#e4405f" size={18} /> Instagram</button>
                                    </div>
                                )}
                            </div>
                        </div>

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
                            { id: "traceability", label: "Truy xuất nguồn gốc" },
                            { id: "shop", label: "Thông tin shop" }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "12px 0", background: "none", border: "none", fontSize: "16px", fontWeight: activeTab === tab.id ? "600" : "400", color: activeTab === tab.id ? "#2e7d32" : "#666", borderBottom: activeTab === tab.id ? "3px solid #2e7d32" : "none", cursor: "pointer" }}>
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

                        {activeTab === "traceability" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                    <h3 style={{ margin: 0, fontSize: "18px" }}>Hành trình sản phẩm</h3>
                                    {hasTraceability && (
                                        <button onClick={() => setShowQRModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontSize: "13px" }}>
                                            <FaQrcode /> Xem mã QR
                                        </button>
                                    )}
                                </div>

                                {!hasTraceability ? (
                                    <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8f9fa", borderRadius: "16px" }}>
                                        <FaQrcode size={64} color="#ccc" style={{ marginBottom: "16px" }} />
                                        <h4 style={{ color: "#666", marginBottom: "8px" }}>Chưa có thông tin truy xuất nguồn gốc</h4>
                                        <p style={{ color: "#999", fontSize: "14px" }}>Sản phẩm này đang được cập nhật thông tin</p>
                                        {product.origin && (
                                            <div style={{ marginTop: "20px", padding: "12px 20px", background: "#e8f5e9", borderRadius: "12px", display: "inline-block" }}>
                                                <FaMapMarkerAlt color="#2e7d32" style={{ marginRight: "8px" }} />
                                                <span style={{ color: "#2e7d32", fontSize: "14px" }}>Xuất xứ: {product.origin}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {/* Thông tin xuất xứ và kiểm định */}
                                        <div style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", borderRadius: "16px", padding: "20px", marginBottom: "32px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                                <FaCertificate size={28} color="#2e7d32" />
                                                <h4 style={{ margin: 0, color: "#1b5e20" }}>Thông tin sản phẩm</h4>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                                                {product.origin && (
                                                    <div><strong>Xuất xứ:</strong> {product.origin}</div>
                                                )}
                                                {traceability?.created_at && (
                                                    <div><strong>Ngày đăng ký:</strong> {formatDate(traceability.created_at)}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        {traceability?.trace_events && traceability.trace_events.length > 0 ? (
                                            <div className="trace-timeline" style={{ position: "relative", paddingLeft: "30px" }}>
                                                <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, #4caf50, #ff9800, #2196f3)" }} />
                                                {traceability.trace_events.map((event, index) => (
                                                    <div key={index} style={{ position: "relative", marginBottom: "32px" }}>
                                                        <div style={{ position: "absolute", left: "-30px", top: 0, width: "32px", height: "32px", borderRadius: "50%", background: "#4caf50", display: "flex", alignItems: "center", justifyContent: "center", color: "white", zIndex: 1 }}>
                                                            {getStageIcon(event.stage)}
                                                        </div>
                                                        <div style={{ background: "white", borderRadius: "16px", padding: "20px", marginLeft: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                                                                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: "#4caf50", color: "white", fontSize: "12px", fontWeight: "500" }}>{getStageName(event.stage)}</span>
                                                                {event.date && <span style={{ fontSize: "12px", color: "#999" }}><FaCalendarAlt style={{ marginRight: "4px" }} />{new Date(event.date).toLocaleDateString('vi-VN')}</span>}
                                                            </div>
                                                            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>{event.title}</h4>
                                                            <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "12px", fontSize: "14px" }}>{event.description}</p>
                                                            {event.location && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888" }}>
                                                                    <FaMapMarkerAlt size={12} /> {event.location}
                                                                </div>
                                                            )}
                                                            {event.responsible_party && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888", marginTop: "8px" }}>
                                                                    <FaUser size={12} /> {event.responsible_party}
                                                                </div>
                                                            )}
                                                            {event.images && event.images.length > 0 && (
                                                                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                                                                    {event.images.map((img, imgIdx) => (
                                                                        <img key={imgIdx} src={img} alt={`Hình ảnh ${imgIdx + 1}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: "16px" }}>
                                                <p style={{ color: "#999" }}>Đang cập nhật hành trình sản phẩm...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                        <button onClick={handleShopClick} style={{ marginTop: "20px", padding: "10px 24px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>Xem cửa hàng</button>
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
                                    style={{ background: "white", borderRadius: "16px", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "transform 0.3s" }} 
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} 
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    <img 
                                        src={relatedProduct.image_url || "https://via.placeholder.com/300"} 
                                        alt={relatedProduct.name} 
                                        style={{ width: "100%", height: "180px", objectFit: "cover" }} 
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                                    />
                                    <div style={{ padding: "12px" }}>
                                        <h4 style={{ fontSize: "14px", marginBottom: "8px", fontWeight: "600", color: "#333" }}>{relatedProduct.name}</h4>
                                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>{renderStars(relatedProduct.rating || 4.5)}</div>
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
                        <QRCodeCanvas id="qr-code-canvas" value={`${window.location.origin}/product/${product.id}/trace`} size={200} level="H" includeMargin={true} style={{ margin: "0 auto 20px" }} />
                        <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>Quét mã QR để xem thông tin truy xuất nguồn gốc sản phẩm</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={handleDownloadQR} style={{ padding: "10px 20px", background: "#2e7d32", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><FaDownload /> Tải QR</button>
                            <button onClick={() => setShowQRModal(false)} style={{ padding: "10px 20px", background: "#f5f5f5", border: "none", borderRadius: "30px", cursor: "pointer" }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes toastFadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); visibility: hidden; }
                }
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button { opacity: 1; }
                .hide-arrows::-webkit-inner-spin-button, 
                .hide-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                .hide-arrows { -moz-appearance: textfield; }
            `}</style>
        </ShopDetailLayout>
    );
};

export default ProductDetailPage;