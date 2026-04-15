// pages/user/product/FavoriteProductsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import ShopDetailLayout from "../../components/layout/ShopDetailLayout";
import { 
  FaHeart, 
  FaShoppingCart, 
  FaStar, 
  FaStarHalfAlt, 
  FaRegStar,
  FaTrash,
  FaSpinner,
  FaStore
} from 'react-icons/fa';

const FavoriteProductsPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("user_token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await api.get('/api/v1/favorites/my-favorites?limit=50');
      setFavorites(response.data.data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      showToast("Không thể tải danh sách yêu thích", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    setRemovingId(productId);
    try {
      await api.delete(`/api/v1/favorites/${productId}`);
      setFavorites(prev => prev.filter(fav => fav.product_id !== productId));
      showToast("Đã xóa khỏi danh sách yêu thích", "success");
      window.dispatchEvent(new Event('favoriteUpdated'));
    } catch (error) {
      console.error("Error removing favorite:", error);
      showToast("Có lỗi xảy ra", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product) => {
    setAddingToCartId(product.id);
    try {
      await api.post('/api/v1/cart/add', null, {
        params: {
          product_id: product.id,
          quantity: 1,
          variant_id: null,
          shop_id: product.shop_id
        }
      });
      showToast(`Đã thêm ${product.name} vào giỏ hàng!`, 'success');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Có lỗi xảy ra khi thêm vào giỏ hàng", "error");
    } finally {
      setAddingToCartId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
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

  if (loading) {
    return (
      <ShopDetailLayout>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <FaSpinner className="spinning" size={48} color="#2e7d32" />
          <p>Đang tải danh sách yêu thích...</p>
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
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              padding: "24px 40px",
              minWidth: "280px",
              textAlign: "center",
              backgroundColor: toast.type === 'success' ? '#e8f5e9' : '#ffebee'
            }}>
              <div style={{
                width: "60px",
                height: "60px",
                margin: "0 auto 16px",
                background: toast.type === 'success' ? "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)" : "#f44336",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {toast.type === 'success' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
              </div>
              <div style={{ fontSize: "16px", color: toast.type === 'success' ? "#2e7d32" : "#c62828" }}>
                {toast.message}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "32px", borderBottom: "2px solid #f0f0f0", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "28px", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
            <FaHeart color="#ff4444" size={28} />
            Sản phẩm yêu thích
          </h1>
          <p style={{ color: "#666", marginTop: "8px" }}>
            {favorites.length} sản phẩm bạn đã thích
          </p>
        </div>

        {/* Favorites List */}
        {favorites.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#f8f9fa", borderRadius: "24px" }}>
            <FaHeart size={64} color="#ccc" style={{ marginBottom: "20px" }} />
            <h3 style={{ color: "#666", marginBottom: "8px" }}>Chưa có sản phẩm yêu thích</h3>
            <p style={{ color: "#999", marginBottom: "24px" }}>Hãy khám phá và thêm sản phẩm bạn yêu thích</p>
            <button 
              onClick={() => navigate('/shop')}
              style={{
                padding: "12px 32px",
                background: "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Khám phá ngay
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {favorites.map((fav) => {
              const product = fav.product;
              if (!product) return null;
              
              return (
                <div 
                  key={fav._id}
                  style={{
                    display: "flex",
                    background: "white",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.3s, boxShadow 0.3s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* Product Image */}
                  <div 
                    style={{ width: "160px", flexShrink: 0, cursor: "pointer" }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img 
                      src={product.image_url || "https://via.placeholder.com/160"} 
                      alt={product.name}
                      style={{ width: "100%", height: "160px", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/160"; }}
                    />
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div 
                        style={{ 
                          fontSize: "18px", 
                          fontWeight: "600", 
                          color: "#333", 
                          marginBottom: "8px",
                          cursor: "pointer"
                        }}
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {product.name}
                      </div>
                      
                      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                        {renderStars(product.rating || 4.5)}
                      </div>
                      
                      <div style={{ fontSize: "22px", fontWeight: "bold", color: "#d32f2f", marginBottom: "8px" }}>
                        {formatCurrency(product.price)}
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666", fontSize: "13px" }}>
                        <FaStore size={12} color="#2e7d32" />
                        <span>{product.shop_name || "Cửa hàng"}</span>
                      </div>
                      
                      {product.stock > 0 ? (
                        <span style={{ 
                          display: "inline-block", 
                          marginTop: "8px",
                          padding: "2px 8px", 
                          background: "#e8f5e9", 
                          color: "#2e7d32", 
                          borderRadius: "20px", 
                          fontSize: "12px" 
                        }}>
                          Còn hàng
                        </span>
                      ) : (
                        <span style={{ 
                          display: "inline-block", 
                          marginTop: "8px",
                          padding: "2px 8px", 
                          background: "#ffebee", 
                          color: "#f44336", 
                          borderRadius: "20px", 
                          fontSize: "12px" 
                        }}>
                          Hết hàng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "center", 
                    gap: "12px", 
                    padding: "16px",
                    borderLeft: "1px solid #f0f0f0"
                  }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCartId === product.id || product.stock === 0}
                      style={{
                        padding: "10px 20px",
                        background: product.stock === 0 ? "#ccc" : "#2e7d32",
                        color: "white",
                        border: "none",
                        borderRadius: "30px",
                        cursor: product.stock === 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => {
                        if (product.stock > 0) {
                          e.currentTarget.style.background = "#1b5e20";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.stock > 0) {
                          e.currentTarget.style.background = "#2e7d32";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {addingToCartId === product.id ? (
                        <FaSpinner className="spinning" size={14} />
                      ) : (
                        <FaShoppingCart size={14} />
                      )}
                      {addingToCartId === product.id ? "Đang thêm..." : "Thêm vào giỏ"}
                    </button>

                    <button
                      onClick={() => handleRemoveFavorite(product.id)}
                      disabled={removingId === product.id}
                      style={{
                        padding: "10px 20px",
                        background: "white",
                        color: "#f44336",
                        border: "1px solid #f44336",
                        borderRadius: "30px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ffebee";
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {removingId === product.id ? (
                        <FaSpinner className="spinning" size={14} />
                      ) : (
                        <FaTrash size={14} />
                      )}
                      {removingId === product.id ? "Đang xóa..." : "Bỏ thích"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default FavoriteProductsPage;