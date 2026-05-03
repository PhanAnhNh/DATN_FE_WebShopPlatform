import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import {userApi} from "../../../api/api";
import locationApi from "../../../api/locationApi";
import { useUserLocation } from "../../../components/Hooks/useUserLocation";
import NavigationTabs from "../../../components/Shoplayout/NavigationTabs";

const ShopPage = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [priceRange, setPriceRange] = useState({ from: "", to: "" });
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [hotProducts, setHotProducts] = useState([]);
    const [allShops, setAllShops] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState({});
    const { location, loading: locationLoading } = useUserLocation();
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const locationPath = useLocation();

    // Fetch provinces from API
    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchProvinces = async () => {
        try {
            const cachedProvinces = sessionStorage.getItem('shop_provinces');
            const cacheTime = sessionStorage.getItem('shop_cache_timestamp');
            const now = Date.now();
            const isCacheValid = cacheTime && (now - parseInt(cacheTime) < 300000);

            if (cachedProvinces && isCacheValid) {
                setProvinces(JSON.parse(cachedProvinces));
                console.log("✅ Loaded provinces from cache");
                return;
            }

            const res = await locationApi.getAllProvinces('active');
            const provincesWithId = (res.data || []).map(province => ({
                ...province,
                id: province.id || province._id
            }));
            setProvinces(provincesWithId);
            sessionStorage.setItem('shop_provinces', JSON.stringify(provincesWithId));
            console.log("✅ Loaded provinces from API");
        } catch (error) {
            console.error('Error fetching provinces:', error);
        }
    };

    const fetchHotProducts = async () => {
        try {
            const cachedHot = sessionStorage.getItem('shop_hotProducts');
            const cacheTime = sessionStorage.getItem('shop_full_cache_timestamp');
            const now = Date.now();
            const isCacheValid = cacheTime && (now - parseInt(cacheTime) < 300000);

            if (cachedHot && isCacheValid) {
                setHotProducts(JSON.parse(cachedHot));
                console.log("✅ Loaded hot products from cache");
                return;
            }

            const res = await userApi.get("/api/v1/products/hot/", {
                params: { limit: 3 }
            });
            
            console.log("🔥 API Response:", res.data);

            let productsData = null;
            if (Array.isArray(res.data)) {
                productsData = res.data;
            } else if (res.data && Array.isArray(res.data.data)) {
                productsData = res.data.data;
            } else if (res.data && Array.isArray(res.data.products)) {
                productsData = res.data.products;
            } else {
                console.error("❌ Unexpected data structure:", res.data);
                setHotProducts([]);
                return;
            }

            const formatted = productsData.map(product => ({
                id: product.id || product._id,
                name: product.name,
                price: product.price,
                unit: product.unit || "kg",
                shop_name: product.shop_name || product.shop?.name || "Cửa hàng",
                image: product.image_url || product.image || "https://via.placeholder.com/300?text=No+Image",
                fallbackIcon: "🔥",
                sold_quantity: product.sold_quantity || 0
            }));
            
            setHotProducts(formatted);
            sessionStorage.setItem('shop_hotProducts', JSON.stringify(formatted));
            
        } catch (error) {
            console.error("❌ Error fetching hot products:", error);
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", error.response.data);
            }
            setHotProducts([]);
        }
    };

    // Hàm đọc cache đầy đủ khi component mount
    const loadFullCache = () => {
        const cachedProducts = sessionStorage.getItem('shop_featuredProducts');
        const cachedHot = sessionStorage.getItem('shop_hotProducts');
        const cachedShops = sessionStorage.getItem('shop_allShops');
        const cacheTime = sessionStorage.getItem('shop_full_cache_timestamp');
        const cachedCategory = sessionStorage.getItem('shop_activeCategory');
        const cachedSubCategory = sessionStorage.getItem('shop_selectedSubCategory');
        const cachedPriceRange = sessionStorage.getItem('shop_priceRange');
        
        const now = Date.now();
        const isCacheValid = cacheTime && (now - parseInt(cacheTime) < 300000);
        
        let hasValidCache = false;
        
        if (cachedProducts && isCacheValid) {
            try {
                setFeaturedProducts(JSON.parse(cachedProducts));
                hasValidCache = true;
                console.log("✅ Loaded products from cache");
            } catch (e) {
                console.error("Error parsing products cache:", e);
            }
        }
        
        if (cachedHot && isCacheValid) {
            try {
                setHotProducts(JSON.parse(cachedHot));
                hasValidCache = true;
                console.log("✅ Loaded hot products from cache");
            } catch (e) {
                console.error("Error parsing hot products cache:", e);
            }
        }
        
        if (cachedShops && isCacheValid) {
            try {
                setAllShops(JSON.parse(cachedShops));
                hasValidCache = true;
                console.log("✅ Loaded shops from cache");
            } catch (e) {
                console.error("Error parsing shops cache:", e);
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

    // Hàm lưu cache đầy đủ
    const saveFullCache = () => {
        if (featuredProducts.length > 0) {
            sessionStorage.setItem('shop_featuredProducts', JSON.stringify(featuredProducts));
        }
        if (hotProducts.length > 0) {
            sessionStorage.setItem('shop_hotProducts', JSON.stringify(hotProducts));
        }
        if (allShops.length > 0) {
            sessionStorage.setItem('shop_allShops', JSON.stringify(allShops));
        }
        sessionStorage.setItem('shop_activeCategory', activeCategory);
        sessionStorage.setItem('shop_selectedSubCategory', selectedSubCategory);
        sessionStorage.setItem('shop_priceRange', JSON.stringify(priceRange));
        sessionStorage.setItem('shop_full_cache_timestamp', Date.now().toString());
    };

    // Effect để lưu cache khi có thay đổi dữ liệu
    useEffect(() => {
        if (!isInitialLoad && (featuredProducts.length > 0 || hotProducts.length > 0 || allShops.length > 0)) {
            saveFullCache();
        }
    }, [featuredProducts, hotProducts, allShops, activeCategory, selectedSubCategory, priceRange]);

    // Effect chính - load dữ liệu khi mount
    useEffect(() => {
        const hasCache = loadFullCache();
        
        if (hasCache && (featuredProducts.length > 0 || hotProducts.length > 0 || allShops.length > 0)) {
            console.log("Using cached data - no API calls made");
            setLoading(false);
            setIsInitialLoad(false);
        } else {
            console.log("No valid cache, fetching all data from API");
            fetchAllData();
        }
    }, []);

    // Khi có location thay đổi
    useEffect(() => {
        if (location && isInitialLoad === false && allShops.length === 0) {
            fetchAllShops();
        }
    }, [location]);

    // Fetch tất cả dữ liệu từ API
    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch products thường
            const productsRes = await userApi.get("/api/v1/products/", {
                params: {
                    category: activeCategory !== "all" ? activeCategory : undefined,
                    sub_category: selectedSubCategory || undefined
                }
            });
            
            const products = (productsRes.data || []).map(product => ({
                id: product.id || product._id,
                name: product.name,
                price: product.price,
                unit: product.unit || "kg",
                shop_name: product.shop_name || product.shop?.name || "Cửa hàng",
                image: product.image_url || product.image || "https://via.placeholder.com/300?text=No+Image",
                fallbackIcon: "🍎"
            }));
            
            setFeaturedProducts(products);
            console.log("✅ Loaded products from API:", products.length);
            
            await fetchHotProducts();
            
            // Fetch shops nếu có location
            if (location) {
                await fetchAllShops();
            } else {
                // Nếu chưa có location, vẫn fetch tất cả shop (không có distance)
                await fetchAllShopsWithoutLocation();
            }
            
            sessionStorage.setItem('shop_full_cache_timestamp', Date.now().toString());
            
        } catch (error) {
            console.error("Error fetching data:", error);
            setFeaturedProducts([]);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    };

    // 👈 HÀM MỚI: Fetch tất cả shop (có tính khoảng cách nếu có location)
    const fetchAllShops = async () => {
        setNearbyLoading(true);
        try {
            const locationKey = location ? `${location.lat}_${location.lng}` : 'no_location';
            const cachedShops = sessionStorage.getItem(`shop_all_${locationKey}`);
            const cacheTime = sessionStorage.getItem('shop_full_cache_timestamp');
            const now = Date.now();
            const isCacheValid = cacheTime && (now - parseInt(cacheTime) < 300000);
            
            if (cachedShops && isCacheValid) {
                setAllShops(JSON.parse(cachedShops));
                console.log("✅ Loaded all shops from cache");
                setNearbyLoading(false);
                return;
            }
            
            // Gọi API lấy danh sách tất cả shop (hoặc shop trong bán kính lớn)
            const res = await userApi.get("/api/v1/shops/nearby", {
                params: location ? {
                    lat: location.lat,
                    lng: location.lng,
                    radius_km: 100, // Tăng bán kính lên 100km để lấy nhiều shop hơn
                    limit: 100
                } : {
                    limit: 100
                }
            });
            
            console.log("All shops response:", res.data);
            
            let shops = (res.data.data || []);
            
            // Format và sắp xếp theo khoảng cách (gần lên trước)
            const formatted = shops.map(shop => ({
                id: shop._id || shop.id,
                name: shop.name,
                address: shop.address || shop.location?.address || "Đang cập nhật",
                rating: shop.rating || 4.5,
                distance_km: shop.distance_km || null,
                distance_text: shop.distance_km ? (
                    shop.distance_km < 1 
                        ? `${Math.round(shop.distance_km * 1000)}m` 
                        : `${shop.distance_km.toFixed(1)}km`
                ) : null,
                avatar: shop.logo_url,
                banner_url: shop.banner_url,
                cover_image: shop.banner_url || "https://via.placeholder.com/300x160?text=Shop"
            }));
            
            // Sắp xếp: shop có distance_km (gần) lên trước, sau đó đến shop không có distance
            const sortedShops = formatted.sort((a, b) => {
                if (a.distance_km === null && b.distance_km === null) return 0;
                if (a.distance_km === null) return 1;
                if (b.distance_km === null) return -1;
                return a.distance_km - b.distance_km;
            });
            
            console.log("Formatted and sorted shops:", sortedShops);
            setAllShops(sortedShops);
            
            sessionStorage.setItem(`shop_all_${locationKey}`, JSON.stringify(sortedShops));
            
        } catch (error) {
            console.error("Lỗi lấy danh sách shop:", error);
            // Nếu lỗi, thử fetch không có location
            await fetchAllShopsWithoutLocation();
        } finally {
            setNearbyLoading(false);
        }
    };

    // Fetch tất cả shop khi chưa có location (không tính khoảng cách)
    const fetchAllShopsWithoutLocation = async () => {
        try {
            const res = await userApi.get("/api/v1/shops/", {
                params: { limit: 100 }
            });
            
            console.log("All shops without location response:", res.data);
            
            const shopsData = res.data.data || res.data || [];
            const formatted = shopsData.map(shop => ({
                id: shop._id || shop.id,
                name: shop.name,
                address: shop.address || shop.location?.address || "Đang cập nhật",
                rating: shop.rating || 4.5,
                distance_km: null,
                distance_text: null,
                avatar: shop.logo_url,
                banner_url: shop.banner_url,
                cover_image: shop.banner_url || "https://via.placeholder.com/300x160?text=Shop"
            }));
            
            setAllShops(formatted);
            
            sessionStorage.setItem(`shop_all_no_location`, JSON.stringify(formatted));
            
        } catch (error) {
            console.error("Lỗi lấy danh sách shop (không location):", error);
            setAllShops([]);
        }
    };

    const handleProvinceClick = (provinceId) => {
        navigate(`/province/${provinceId}`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const goToForum = () => {
        if (locationPath.pathname === "/") return;
        navigate("/");
    };

    const goToShop = () => {
        if (locationPath.pathname === "/use/shop") return; 
        navigate("/use/shop");
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

    const ProductImage = ({ product, isHot = false }) => {
        const hasError = imageErrors[`product-${product.id}`];
        
        if (hasError || !product.image) {
            return (
                <div style={{ 
                    fontSize: "48px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    width: "100%",
                    height: "120px",
                    background: "#f0f0f0",
                    borderRadius: "8px"
                }}>
                    {product.fallbackIcon || (isHot ? "🔥" : "🍎")}
                </div>
            );
        }
        
        return (
            <img 
                src={product.image} 
                alt={product.name}
                style={{ 
                    width: "100%", 
                    height: "120px", 
                    objectFit: "cover",
                    borderRadius: "8px"
                }}
                onError={() => handleImageError(product.id, 'product')}
            />
        );
    };

    const isLoadingShops = nearbyLoading || (locationLoading && !location);

    const displayProducts = hotProducts.length > 0 ? hotProducts : featuredProducts.slice(0, 3);

    // Media query styles for responsive
    const isMobile = () => window.innerWidth <= 768;
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Layout>
            <div className="shop-page" style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobileView ? "10px" : "0" }}>
                {/* Header tabs */}
                <NavigationTabs />

                {/* Khu vực tỉnh thành - Grid 2 cột trên mobile */}
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}>
                    <h3 style={{ marginBottom: "15px", fontSize: isMobileView ? "16px" : "18px" }}>Khám phá các tỉnh thành</h3>
                    {provinces.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                            Đang tải danh sách tỉnh thành...
                        </div>
                    ) : (
                        <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: isMobileView ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(280px, 1fr))", 
                            gap: isMobileView ? "12px" : "20px" 
                        }}>
                            {provinces.slice(0, isMobileView ? 6 : provinces.length).map(province => (
                                <div
                                    key={province.id}
                                    onClick={() => handleProvinceClick(province.id)}
                                    style={{
                                        height: isMobileView ? "140px" : "160px",
                                        borderRadius: "12px",
                                        backgroundImage: `url(${province.image_url || 'https://via.placeholder.com/400x200?text=No+Image'})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        fontSize: "18px",
                                        color: "white",
                                        cursor: "pointer",
                                        position: "relative",
                                        overflow: "hidden",
                                        transition: "transform 0.3s ease, box-shadow 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.02)";
                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <div style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                                        padding: isMobileView ? "10px" : "15px",
                                        textAlign: "center"
                                    }}>
                                        <div style={{ fontWeight: "bold", fontSize: isMobileView ? "14px" : "16px" }}>{province.name}</div>
                                        {!isMobileView && province.description && (
                                            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.9 }}>
                                                {province.description.length > 50 ? province.description.substring(0, 50) + "..." : province.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {isMobileView && provinces.length > 6 && (
                        <div style={{ textAlign: "center", marginTop: "12px" }}>
                            <button style={{
                                padding: "8px 16px",
                                background: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "20px",
                                cursor: "pointer",
                                fontSize: "12px"
                            }} onClick={() => {
                                // Handle show more provinces
                                const moreProvinces = provinces.slice(6);
                                // You can implement modal or expand logic here
                                alert(`Còn ${moreProvinces.length} tỉnh thành nữa`);
                            }}>
                                Xem thêm {provinces.length - 6} tỉnh
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: "20px", flexDirection: isMobileView ? "column" : "row" }}>
                    {/* Nội dung chính bên phải */}
                    <div style={{ flex: 1 }}>
                        {/* SẢN PHẨM HOT - BÁN CHẠY NHẤT - Horizontal scroll on mobile */}
                        <div style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                                <span style={{ fontSize: "24px" }}>🔥</span>
                                <h3 style={{ margin: 0, fontSize: isMobileView ? "16px" : "18px", color: "#333" }}>Sản phẩm bán chạy nhất</h3>
                                <span style={{ 
                                    background: "#ff5722", 
                                    color: "white", 
                                    padding: "2px 8px", 
                                    borderRadius: "20px", 
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    Hot
                                </span>
                            </div>
                            
                            {isMobileView ? (
                                // Horizontal scroll for mobile
                                <div style={{
                                    overflowX: "auto",
                                    overflowY: "hidden",
                                    whiteSpace: "nowrap",
                                    WebkitOverflowScrolling: "touch",
                                    scrollbarWidth: "thin",
                                    paddingBottom: "10px"
                                }}>
                                    <div style={{ display: "inline-flex", gap: "15px" }}>
                                        {loading && displayProducts.length === 0 ? (
                                            <div style={{ textAlign: "center", width: "200px", padding: "40px" }}>Đang tải...</div>
                                        ) : displayProducts.length === 0 ? (
                                            <div style={{ textAlign: "center", width: "200px", padding: "40px", color: "#999" }}>
                                                Chưa có sản phẩm nào
                                            </div>
                                        ) : (
                                            displayProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleProductClick(product.id)}
                                                    style={{
                                                        cursor: "pointer",
                                                        textAlign: "center",
                                                        padding: "15px",
                                                        borderRadius: "8px",
                                                        transition: "all 0.3s",
                                                        background: "#f9f9f9",
                                                        position: "relative",
                                                        width: "180px",
                                                        display: "inline-block",
                                                        whiteSpace: "normal"
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                                >
                                                    <ProductImage product={product} isHot={true} />
                                                    
                                                    <div style={{ 
                                                        fontWeight: "bold", 
                                                        marginTop: "10px", 
                                                        whiteSpace: "normal",
                                                        wordBreak: "break-word",
                                                        fontSize: "14px"
                                                    }}>
                                                        {product.name}
                                                    </div>
                                                    
                                                    <div style={{ color: "#d32f2f", fontWeight: "bold", marginTop: "5px", fontSize: "14px" }}>
                                                        {formatCurrency(product.price)}/{product.unit || "kg"}
                                                    </div>
                                                    
                                                    <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", whiteSpace: "normal" }}>
                                                        {product.shop_name}
                                                    </div>
                                                    
                                                    {product.sold_quantity !== undefined && (
                                                        <div style={{ 
                                                            fontSize: "11px", 
                                                            color: "#ff5722", 
                                                            marginTop: "5px",
                                                            fontWeight: "500"
                                                        }}>
                                                            🛒 Đã bán: {product.sold_quantity.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Grid for desktop
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                                    {loading && displayProducts.length === 0 ? (
                                        <div style={{ textAlign: "center", width: "100%", padding: "40px" }}>Đang tải...</div>
                                    ) : displayProducts.length === 0 ? (
                                        <div style={{ textAlign: "center", width: "100%", padding: "40px", color: "#999" }}>
                                            Chưa có sản phẩm nào
                                        </div>
                                    ) : (
                                        displayProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductClick(product.id)}
                                                style={{
                                                    cursor: "pointer",
                                                    textAlign: "center",
                                                    padding: "15px",
                                                    borderRadius: "8px",
                                                    transition: "all 0.3s",
                                                    background: "#f9f9f9",
                                                    position: "relative"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                            >
                                                <ProductImage product={product} isHot={true} />
                                                
                                                <div style={{ 
                                                    fontWeight: "bold", 
                                                    marginTop: "10px", 
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis" 
                                                }}>
                                                    {product.name}
                                                </div>
                                                
                                                <div style={{ color: "#d32f2f", fontWeight: "bold", marginTop: "5px" }}>
                                                    {formatCurrency(product.price)}/{product.unit || "kg"}
                                                </div>
                                                
                                                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                                                    {product.shop_name}
                                                </div>
                                                
                                                {product.sold_quantity !== undefined && (
                                                    <div style={{ 
                                                        fontSize: "11px", 
                                                        color: "#ff5722", 
                                                        marginTop: "5px",
                                                        fontWeight: "500"
                                                    }}>
                                                        🛒 Đã bán: {product.sold_quantity.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* DANH SÁCH TẤT CẢ CỬA HÀNG - Grid 2 cột trên mobile */}
                        <div style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                            <h3 style={{ margin: "0 0 15px 0", fontSize: isMobileView ? "16px" : "18px", color: "#333" }}>
                                🏪 Danh sách cửa hàng
                            </h3>
                            
                            {isLoadingShops && allShops.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <div style={{ 
                                        width: "30px", 
                                        height: "30px", 
                                        border: "3px solid #f3f3f3", 
                                        borderTop: "3px solid #2e7d32", 
                                        borderRadius: "50%", 
                                        animation: "spin 1s linear infinite",
                                        margin: "0 auto 10px"
                                    }}></div>
                                    <p>Đang tải danh sách cửa hàng...</p>
                                    <style>{`
                                        @keyframes spin {
                                            0% { transform: rotate(0deg); }
                                            100% { transform: rotate(360deg); }
                                        }
                                    `}</style>
                                </div>
                            ) : allShops.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                    🏪 Không tìm thấy cửa hàng nào
                                </div>
                            ) : (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: isMobileView ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                                    gap: isMobileView ? "12px" : "20px"
                                }}>
                                    {allShops.slice(0, isMobileView ? 6 : allShops.length).map(shop => {
                                        // Kiểm tra xem có hiển thị khoảng cách không (chỉ hiển thị nếu distance_km <= 10)
                                        const showDistance = shop.distance_km !== null && shop.distance_km <= 10;
                                        
                                        return (
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
                                                    height: isMobileView ? "120px" : "160px",
                                                    backgroundImage: `url(${shop.banner_url || shop.cover_image || "https://via.placeholder.com/300x160?text=Shop"})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    backgroundColor: "#f5f5f5"
                                                }} />

                                                <div style={{ padding: isMobileView ? "12px" : "15px" }}>
                                                    <div style={{ 
                                                        fontWeight: "bold", 
                                                        fontSize: isMobileView ? "13px" : "16px", 
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        maxWidth: "100%" 
                                                    }}>
                                                        {shop.name}
                                                    </div>

                                                    <div style={{ 
                                                        marginTop: "6px", 
                                                        color: "#666", 
                                                        fontSize: isMobileView ? "11px" : "13px",
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        gap: "4px"
                                                    }}>
                                                        <span>📍</span>
                                                        <span style={{ 
                                                            wordBreak: "break-word", 
                                                            whiteSpace: "normal",
                                                            lineHeight: "1.3",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 1,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis"
                                                        }}>
                                                            {shop.address}
                                                        </span>
                                                    </div>

                                                    <div style={{ marginTop: "4px", color: "#f5b042", fontSize: isMobileView ? "12px" : "14px" }}>
                                                        ⭐ {shop.rating}
                                                    </div>

                                                    {showDistance && (
                                                        <div style={{ color: "#4CAF50", fontSize: isMobileView ? "11px" : "14px", marginTop: "4px", fontWeight: "500" }}>
                                                            🚗 Cách bạn: <strong>{shop.distance_text}</strong>
                                                        </div>
                                                    )}
                                                    
                                                    {shop.distance_km !== null && shop.distance_km > 10 && (
                                                        <div style={{ color: "#999", fontSize: isMobileView ? "10px" : "12px", marginTop: "4px", fontStyle: "italic" }}>
                                                            (Xa hơn 10km)
                                                        </div>
                                                    )}

                                                    <button
                                                        style={{
                                                            marginTop: "10px",
                                                            width: "100%",
                                                            padding: isMobileView ? "8px" : "10px",
                                                            borderRadius: "20px",
                                                            background: "#4CAF50",
                                                            color: "white",
                                                            border: "none",
                                                            fontWeight: "bold",
                                                            cursor: "pointer",
                                                            fontSize: isMobileView ? "12px" : "14px"
                                                        }}
                                                        onClick={() => handleShopClick(shop.id)}
                                                    >
                                                        Xem cửa hàng
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {isMobileView && allShops.length > 6 && (
                                <div style={{ textAlign: "center", marginTop: "16px" }}>
                                    <button style={{
                                        padding: "10px 20px",
                                        background: "#4CAF50",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "25px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "bold"
                                    }} onClick={() => {
                                        // Handle show more shops
                                        alert(`Xem thêm cửa hàng`);
                                    }}>
                                        Xem thêm cửa hàng
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ShopPage;