import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import {userApi} from "../../../api/api";
import locationApi from "../../../api/locationApi";
import { useUserLocation } from "../../../components/Hooks/useUserLocation";

const ShopPage = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [priceRange, setPriceRange] = useState({ from: "", to: "" });
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [hotProducts, setHotProducts] = useState([]);
    const [allShops, setAllShops] = useState([]); // 👈 ĐỔI TÊN từ featuredShops thành allShops
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
        const cachedShops = sessionStorage.getItem('shop_allShops'); // 👈 SỬA TÊN KEY
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
        if (allShops.length > 0) { // 👈 SỬA
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
            fetchAllShops(); // 👈 GỌI HÀM MỚI
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
                await fetchAllShops(); // 👈 GỌI HÀM MỚI
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
                address: shop.address || shop.location?.address || "Đang cập nhật", // 👈 THÊM địa chỉ
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

    // 👈 HÀM MỚI: Fetch tất cả shop khi chưa có location (không tính khoảng cách)
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
                    height: "100px",
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
                    height: "100px", 
                    objectFit: "cover",
                    borderRadius: "8px"
                }}
                onError={() => handleImageError(product.id, 'product')}
            />
        );
    };

    const isLoadingShops = nearbyLoading || (locationLoading && !location);

    const displayProducts = hotProducts.length > 0 ? hotProducts : featuredProducts.slice(0, 3);

    return (
        <Layout>
            <div className="shop-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Header tabs */}
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

                    <div style={{ background: "white", padding: "10px 15px", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", border: "1px solid #eee" }}>
                        <span style={{ fontWeight: "bold", fontSize: "12px", color: "#333" }}>Chế độ tối</span>
                        <div style={{ width: "38px", height: "24px", background: "#333", borderRadius: "15px", position: "relative" }}>
                            <div style={{ width: "18px", height: "18px", background: "white", borderRadius: "50%", position: "absolute", top: "3px", right: "3px" }}></div>
                        </div>
                    </div>
                </div>

                {/* Khu vực tỉnh thành */}
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}>
                    <h3 style={{ marginBottom: "15px" }}>Khám phá các tỉnh thành</h3>
                    {provinces.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                            Đang tải danh sách tỉnh thành...
                        </div>
                    ) : (
                        <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                            gap: "20px" 
                        }}>
                            {provinces.map(province => (
                                <div
                                    key={province.id}
                                    onClick={() => handleProvinceClick(province.id)}
                                    style={{
                                        height: "160px",
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
                                        padding: "15px",
                                        textAlign: "center"
                                    }}>
                                        <div style={{ fontWeight: "bold", fontSize: "16px" }}>{province.name}</div>
                                        {province.description && (
                                            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.9 }}>
                                                {province.description.length > 50 ? province.description.substring(0, 50) + "..." : province.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                    {/* Nội dung chính bên phải */}
                    <div style={{ flex: 1 }}>
                        {/* SẢN PHẨM HOT - BÁN CHẠY NHẤT */}
                        <div style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                                <span style={{ fontSize: "24px" }}>🔥</span>
                                <h3 style={{ margin: 0, fontSize: "18px", color: "#333" }}>Sản phẩm bán chạy nhất</h3>
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
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                                {loading && displayProducts.length === 0 ? (
                                    <div style={{ textAlign: "center", width: "100%", padding: "40px" }}>Đang tải...</div>
                                ) : displayProducts.length === 0 ? (
                                    <div style={{ textAlign: "center", width: "100%", padding: "40px", color: "#999" }}>
                                        Chưa có sản phẩm nào
                                    </div>
                                ) : (
                                    displayProducts.map((product, idx) => (
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
                                            <div style={{
                                                position: "absolute",
                                                top: "-10px",
                                                left: "-10px",
                                                width: "32px",
                                                height: "32px",
                                                background: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#CD7F32",
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "bold",
                                                color: "#333",
                                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                                zIndex: 1
                                            }}>
                                                {idx + 1}
                                            </div>
                                            
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
                        </div>

                        {/* 👈 DANH SÁCH TẤT CẢ CỬA HÀNG (đã sửa theo yêu cầu) */}
                        <div style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "20px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#333" }}>
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
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "20px"
                                }}>
                                    {allShops.map(shop => {
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
                                                    height: "160px",
                                                    backgroundImage: `url(${shop.banner_url || shop.cover_image || "https://via.placeholder.com/300x160?text=Shop"})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    backgroundColor: "#f5f5f5"
                                                }} />

                                                <div style={{ padding: "15px" }}>
                                                    <div style={{ 
                                                        fontWeight: "bold", 
                                                        fontSize: "16px", 
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        maxWidth: "100%" 
                                                    }}>
                                                        {shop.name}
                                                    </div>

                                                    {/* 👈 HIỂN THỊ ĐỊA CHỈ */}
                                                    <div style={{ 
                                                        marginTop: "8px", 
                                                        color: "#666", 
                                                        fontSize: "13px",
                                                        display: "flex",
                                                        alignItems: "flex-start", // Đổi từ center thành flex-start
                                                        gap: "4px"
                                                    }}>
                                                        <span>📍</span>
                                                        <span style={{ 
                                                            wordBreak: "break-word", 
                                                            whiteSpace: "normal",
                                                            lineHeight: "1.4",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 1, // Giới hạn 1 dòng
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis"
                                                        }}>
                                                            {shop.address}
                                                        </span>
                                                    </div>

                                                    <div style={{ marginTop: "5px", color: "#f5b042" }}>
                                                        ⭐ {shop.rating}
                                                    </div>

                                                    {/* 👈 CHỈ HIỂN THỊ KHOẢNG CÁCH NẾU <= 10KM */}
                                                    {showDistance && (
                                                        <div style={{ color: "#4CAF50", fontSize: "14px", marginTop: "5px", fontWeight: "500" }}>
                                                            🚗 Cách bạn: <strong>{shop.distance_text}</strong>
                                                        </div>
                                                    )}
                                                    
                                                    {/* 👈 NẾU CÓ KHOẢNG CÁCH NHƯNG > 10KM, KHÔNG HIỂN THỊ GÌ THÊM */}
                                                    {shop.distance_km !== null && shop.distance_km > 10 && (
                                                        <div style={{ color: "#999", fontSize: "12px", marginTop: "5px", fontStyle: "italic" }}>
                                                            (Xa hơn 10km)
                                                        </div>
                                                    )}

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
                                        );
                                    })}
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