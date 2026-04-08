import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import api from "../../../api/api";

const ShopPage = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [priceRange, setPriceRange] = useState({ from: "", to: "" });
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredShops, setFeaturedShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState({});

    // Khu vực nổi bật với hình ảnh thực tế
    const featuredRegions = [
        { id: 1, name: "Đà Lạt", icon: "🍏", imageUrl: "https://booking.muongthanh.com/upload_images/images/H%60/thanh-pho-da-lat.jpg"},
        { id: 2, name: "Đắk Lắk", icon: "🍎", imageUrl: "data:image/jpeg;base64,..." },
        { id: 3, name: "Nha Trang", icon: "🍊", imageUrl: "data:image/jpeg;base64,..." }
    ];

    // Hàm đọc cache khi component mount
    const loadFromCache = () => {
        const cachedProducts = sessionStorage.getItem('shop_featuredProducts');
        const cachedShops = sessionStorage.getItem('shop_featuredShops');
        const cacheTime = sessionStorage.getItem('shop_cache_timestamp');
        const cachedCategory = sessionStorage.getItem('shop_activeCategory');
        const cachedSubCategory = sessionStorage.getItem('shop_selectedSubCategory');
        const cachedPriceRange = sessionStorage.getItem('shop_priceRange');
        
        const now = Date.now();
        const isCacheValid = cacheTime && (now - parseInt(cacheTime) < 300000);
        
        let hasValidCache = false;
        
        if (cachedProducts && cachedShops && isCacheValid) {
            try {
                setFeaturedProducts(JSON.parse(cachedProducts));
                setFeaturedShops(JSON.parse(cachedShops));
                hasValidCache = true;
                console.log("✅ Loaded products and shops from cache");
            } catch (e) {
                console.error("Error parsing products/shops cache:", e);
            }
        }
        
        if (cachedCategory) {
            setActiveCategory(cachedCategory);
        }
        if (cachedSubCategory) {
            setSelectedSubCategory(cachedSubCategory);
        }
        if (cachedPriceRange) {
            try {
                setPriceRange(JSON.parse(cachedPriceRange));
            } catch (e) {
                console.error("Error parsing price range cache:", e);
            }
        }
        
        return hasValidCache;
    };

    // Hàm lưu cache
    const saveToCache = () => {
        if (featuredProducts.length > 0) {
            sessionStorage.setItem('shop_featuredProducts', JSON.stringify(featuredProducts));
        }
        if (featuredShops.length > 0) {
            sessionStorage.setItem('shop_featuredShops', JSON.stringify(featuredShops));
        }
        sessionStorage.setItem('shop_activeCategory', activeCategory);
        sessionStorage.setItem('shop_selectedSubCategory', selectedSubCategory);
        sessionStorage.setItem('shop_priceRange', JSON.stringify(priceRange));
        sessionStorage.setItem('shop_cache_timestamp', Date.now().toString());
    };

    // Effect để lưu cache khi có thay đổi
    useEffect(() => {
        if (featuredProducts.length > 0 || featuredShops.length > 0) {
            saveToCache();
        }
    }, [featuredProducts, featuredShops, activeCategory, selectedSubCategory, priceRange]);

    // Effect chính - load dữ liệu khi mount hoặc khi filters thay đổi
    useEffect(() => {
        const hasCache = loadFromCache();
        
        if (hasCache && featuredProducts.length > 0 && featuredShops.length > 0) {
            console.log("Using cached data, skipping API call");
            setLoading(false);
        } else {
            console.log("No valid cache, fetching from API");
            fetchData();
        }
    }, []); // Chỉ chạy 1 lần khi mount

    // Effect để fetch khi filters thay đổi
    useEffect(() => {
        // Không fetch lần đầu tiên khi component vừa mount
        const isFirstRender = featuredProducts.length === 0 && featuredShops.length === 0;
        if (!isFirstRender) {
            console.log("Filters changed, fetching new data");
            fetchData();
        }
    }, [activeCategory, selectedSubCategory, priceRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Gọi API lấy sản phẩm nổi bật
            const productsRes = await api.get("/api/v1/products", {
                params: {
                    category: activeCategory !== "all" ? activeCategory : undefined,
                    sub_category: selectedSubCategory || undefined
                }
            });
            const products = productsRes.data || [];
            setFeaturedProducts(products);

            // Gọi API lấy shop nổi bật
            const shopsRes = await api.get("/api/v1/shops");
            
            const mappedShops = (shopsRes.data || []).map(shop => ({
                ...shop,
                id: shop.id || shop._id,
                banner_url: shop.banner_url || shop.cover,
                name: shop.name || shop.shop_name,
                rating: shop.rating || 4.5,
                distance: shop.distance || "1km"
            }));
            
            setFeaturedShops(mappedShops);
            
            // Lưu cache timestamp
            sessionStorage.setItem('shop_cache_timestamp', Date.now().toString());
            
        } catch (error) {
            console.error("Error fetching data:", error);
            // Dùng dữ liệu mẫu nếu có lỗi
            const fallbackProducts = [
                { id: 1, name: "Táo đỏ tươi", price: 60000, unit: "kg", shop_name: "Shop rau củ Đà Lạt", image: "🍎", fallbackIcon: "🍎" },
                { id: 2, name: "Chuối thiên nhiên", price: 20000, unit: "kg", shop_name: "Nông sản sạch", image: "🍌", fallbackIcon: "🍌" }
            ];
            const fallbackShops = [
                {
                    id: 1,
                    name: "Shop rau củ Đà Lạt",
                    rating: 5.0,
                    distance: "2km",
                    avatar: "🌱",
                    cover: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop"
                },
                {
                    id: 2,
                    name: "Hải sản Nha Trang",
                    rating: 4.8,
                    distance: "5km",
                    avatar: "🦐",
                    cover: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=400&fit=crop"
                }
            ];
            setFeaturedProducts(fallbackProducts);
            setFeaturedShops(fallbackShops);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const goToForum = () => {
        navigate('/');
    };

    const goToShop = () => {
        navigate('/shop');
    };

    const handleApplyFilters = () => {
        fetchData();
    };

    const handleShopClick = (shopId) => {
        navigate(`/shop/${shopId}`);
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleImageError = (itemId, type = 'product') => {
        setImageErrors(prev => ({
            ...prev,
            [`${type}-${itemId}`]: true
        }));
    };

    // Component Product Image với fallback
    const ProductImage = ({ product }) => {
        const hasError = imageErrors[`product-${product.id}`];
        
        if (hasError || !product.image) {
            return (
                <div style={{ 
                    fontSize: "48px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    width: "100%",
                    height: "100px",
                    background: "#f0f0f0",
                    borderRadius: "8px"
                }}>
                    {product.fallbackIcon || "🍎"}
                </div>
            );
        }
        
        return (
            <img 
                src={product.image} 
                alt={product.name}
                style={{ 
                    width: "100%", 
                    height: "100px", 
                    objectFit: "cover",
                    borderRadius: "8px"
                }}
                onError={() => handleImageError(product.id, 'product')}
            />
        );
    };

    return (
        <Layout>
            <div className="shop-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Header với các tab Diễn Đàn / Cửa Hàng */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                    <div style={{ display: "flex", flex: 1, gap: "10px" }}>
                        <div 
                            onClick={goToForum}
                            style={{ 
                                flex: 1, 
                                background: "#f0f2f5", 
                                padding: "12px", 
                                textAlign: "center", 
                                borderRadius: "10px", 
                                fontWeight: "bold", 
                                color: "#666", 
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)", 
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Diễn Đàn
                        </div>
                        
                        <div 
                            onClick={goToShop}
                            style={{ 
                                flex: 1, 
                                background: "white", 
                                padding: "12px", 
                                textAlign: "center", 
                                borderRadius: "10px", 
                                fontWeight: "bold", 
                                color: "#2e7d32", 
                                borderBottom: "3px solid #2e7d32",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)", 
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Cửa Hàng
                        </div>
                    </div>

                    {/* Nút làm mới cache */}
                    

                    <div style={{ background: "white", padding: "10px 15px", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", border: "1px solid #eee" }}>
                        <span style={{ fontWeight: "bold", fontSize: "12px", color: "#333" }}>Chế độ tối</span>
                        <div style={{ width: "38px", height: "24px", background: "#333", borderRadius: "15px", position: "relative" }}>
                            <div style={{ width: "18px", height: "18px", background: "white", borderRadius: "50%", position: "absolute", top: "3px", right: "3px" }}></div>
                        </div>
                    </div>
                </div>

                {/* Khu vực nổi bật với hình ảnh */}
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}>
                    <h3 style={{ marginBottom: "15px" }}>Khu Vực Nổi Bật</h3>
                    <div style={{ display: "flex", gap: "15px" }}>
                        {featuredRegions.map(region => (
                            <div
                                key={region.id}
                                style={{
                                    flex: 1,
                                    height: "120px",
                                    borderRadius: "12px",
                                    backgroundImage: `url(${region.imageUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    color: "white",
                                    cursor: "pointer",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                            >
                                <div style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                    padding: "10px",
                                    textAlign: "center"
                                }}>
                                    {region.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                    {/* Nội dung chính bên phải */}
                    <div style={{ flex: 1 }}>
                        {/* Sản phẩm nổi bật */}
                        <div style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#333" }}>Sản phẩm gợi ý</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                                {loading && featuredProducts.length === 0 ? (
                                    <div style={{ textAlign: "center", width: "100%", padding: "40px" }}>Đang tải...</div>
                                ) : (
                                    featuredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductClick(product.id)}
                                            style={{
                                                cursor: "pointer",
                                                textAlign: "center",
                                                padding: "15px",
                                                borderRadius: "8px",
                                                transition: "all 0.3s",
                                                background: "#f9f9f9"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                        >
                                            <ProductImage product={product} />
                                            <div style={{ fontWeight: "bold", marginTop: "10px" }}>{product.name}</div>
                                            <div style={{ color: "#d32f2f", fontWeight: "bold", marginTop: "5px" }}>
                                                {formatCurrency(product.price)}/{product.unit || "kg"}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                                                {product.shop_name}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Danh sách shop */}
                        <div style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#333" }}>Shop gần bạn</h3>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "20px"
                            }}>
                                {loading && featuredShops.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>
                                ) : (
                                    featuredShops.map(shop => (
                                        <div
                                            key={shop.id}
                                            style={{
                                                background: "white",
                                                borderRadius: "16px",
                                                overflow: "hidden",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                                cursor: "pointer",
                                                transition: "0.3s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                        >
                                            <div style={{
                                                height: "160px",
                                                backgroundImage: `url(${shop.banner_url || shop.cover || "https://via.placeholder.com/300x160?text=No+Image"})`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                backgroundColor: "#f5f5f5"
                                            }} />

                                            <div style={{ padding: "15px" }}>
                                                <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                                                    {shop.name}
                                                </div>

                                                <div style={{ marginTop: "8px", color: "#f5b042" }}>
                                                    ⭐ {shop.rating}
                                                </div>

                                                <div style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
                                                    📍 Cách bạn: {shop.distance}
                                                </div>

                                                <button
                                                    style={{
                                                        marginTop: "12px",
                                                        width: "100%",
                                                        padding: "10px",
                                                        borderRadius: "20px",
                                                        background: "#4CAF50",
                                                        color: "white",
                                                        border: "none",
                                                        fontWeight: "bold",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => handleShopClick(shop.id)}
                                                >
                                                    Xem cửa hàng
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ShopPage;