// pages/user/payment/PaymentInstructions.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCopy, FaCheck, FaQrcode, FaBuilding, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../../api/api';
import ShopDetailLayout from '../../../components/layout/ShopDetailLayout';

const PaymentInstructions = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [shopPaymentInfo, setShopPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);

    const shopId = location.state?.shopId;

    useEffect(() => {
        fetchOrderAndPaymentInfo();
    }, [orderId, shopId]);

    const fetchOrderAndPaymentInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Lấy thông tin đơn hàng
            const orderResponse = await api.get(`/api/v1/orders/${orderId}`);
            const orderData = orderResponse.data;
            setOrder(orderData);
            
            let targetShopId = shopId;
            if (!targetShopId && orderData.items && orderData.items.length > 0) {
                targetShopId = orderData.items[0].shop_id;
            }
            
            if (targetShopId) {
                try {
                    // Lấy cài đặt công khai của shop
                    const settingsResponse = await api.get(`/api/v1/shop/settings/public/${targetShopId}`);
                    setShopPaymentInfo(settingsResponse.data);
                } catch (settingsError) {
                    console.error('Error fetching shop settings:', settingsError);
                    // Fallback: tạo thông tin mặc định
                    setShopPaymentInfo({
                        shop_id: targetShopId,
                        shop_name: "Cửa hàng",
                        payment: {
                            bank_accounts: [
                                {
                                    id: "default",
                                    bank_name: "Vietcombank",
                                    account_number: "123456789",
                                    account_name: "CHU TAI KHOAN",
                                    branch: "Hội sở"
                                }
                            ]
                        }
                    });
                }
            } else {
                setError("Không tìm thấy thông tin shop");
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.response?.data?.detail || "Có lỗi xảy ra khi tải thông tin");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'account') {
            setCopiedAccount(true);
            setTimeout(() => setCopiedAccount(false), 2000);
        } else {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <ShopDetailLayout>
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <div className="spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </ShopDetailLayout>
        );
    }

    if (error) {
        return (
            <ShopDetailLayout>
                <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ background: "#ffebee", borderRadius: "16px", padding: "32px" }}>
                        <FaExclamationTriangle size={48} color="#f44336" />
                        <h2 style={{ color: "#d32f2f", marginTop: "16px" }}>Có lỗi xảy ra</h2>
                        <p style={{ color: "#666", margin: "16px 0" }}>{error}</p>
                        <button
                            onClick={() => navigate('/orders')}
                            style={{
                                padding: "10px 24px",
                                background: "#2e7d32",
                                color: "white",
                                border: "none",
                                borderRadius: "30px",
                                cursor: "pointer"
                            }}
                        >
                            Quay lại đơn hàng
                        </button>
                    </div>
                </div>
            </ShopDetailLayout>
        );
    }

    const orderCode = order?.id?.slice(-8).toUpperCase();
    const bankAccounts = shopPaymentInfo?.payment?.bank_accounts || [];

    return (
        <ShopDetailLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
                <button
                    onClick={() => navigate('/orders')}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "none",
                        border: "none",
                        color: "#2e7d32",
                        cursor: "pointer",
                        marginBottom: "20px",
                        fontSize: "14px"
                    }}
                >
                    ← Quay lại danh sách đơn hàng
                </button>

                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                    <h1 style={{ fontSize: "24px", marginBottom: "8px", textAlign: "center" }}>
                        Hướng dẫn thanh toán
                    </h1>
                    <p style={{ textAlign: "center", color: "#666", marginBottom: "24px" }}>
                        Vui lòng chuyển khoản theo thông tin bên dưới
                    </p>

                    {/* Thông tin đơn hàng */}
                    <div style={{
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "24px"
                    }}>
                        <h3 style={{ marginBottom: "16px" }}>📋 Thông tin đơn hàng</h3>
                        <p><strong>Mã đơn hàng:</strong> #{orderCode}</p>
                        <p><strong>Người nhận:</strong> {order?.shipping_address_details?.name || order?.shipping_address?.split(',')[0]}</p>
                        <p><strong>Số điện thoại:</strong> {order?.shipping_address_details?.phone}</p>
                        <p><strong>Địa chỉ giao hàng:</strong> {order?.shipping_address}</p>
                        <p><strong>Số tiền cần thanh toán:</strong> 
                            <span style={{ color: "#d32f2f", fontSize: "20px", fontWeight: "bold", marginLeft: "8px" }}>
                                {formatCurrency(order?.total_amount)}
                            </span>
                        </p>
                    </div>

                    {/* Thông tin chuyển khoản */}
                    <div style={{ marginBottom: "24px" }}>
                        <h3 style={{ marginBottom: "16px" }}>🏦 Thông tin chuyển khoản</h3>
                        
                        {bankAccounts.length > 0 ? (
                            bankAccounts.map((account, idx) => (
                                <div key={account.id} style={{
                                    background: "#f8f9fa",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    marginBottom: idx < bankAccounts.length - 1 ? "16px" : 0
                                }}>
                                    <p style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                        <FaBuilding color="#2e7d32" />
                                        <strong>Ngân hàng:</strong> 
                                        <span>{account.bank_name}</span>
                                    </p>
                                    <p style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                                        <FaUser color="#2e7d32" />
                                        <strong>Số tài khoản:</strong> 
                                        <code style={{
                                            background: "#e9ecef",
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            fontSize: "16px",
                                            fontWeight: "bold"
                                        }}>
                                            {account.account_number}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(account.account_number, 'account')}
                                            style={{
                                                background: "#e8f5e9",
                                                border: "none",
                                                borderRadius: "6px",
                                                padding: "6px 12px",
                                                cursor: "pointer",
                                                color: "#2e7d32"
                                            }}
                                        >
                                            {copiedAccount ? <FaCheck /> : <FaCopy />} Sao chép
                                        </button>
                                    </p>
                                    <p style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                        <strong>Chủ tài khoản:</strong> 
                                        <span>{account.account_name}</span>
                                    </p>
                                    {account.branch && (
                                        <p style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                            <strong>Chi nhánh:</strong> 
                                            <span>{account.branch}</span>
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{
                                background: "#fff3e0",
                                borderRadius: "12px",
                                padding: "16px",
                                textAlign: "center",
                                color: "#e65100"
                            }}>
                                <FaExclamationTriangle size={24} />
                                <p>Shop chưa cập nhật thông tin tài khoản ngân hàng. Vui lòng liên hệ shop để được hỗ trợ.</p>
                            </div>
                        )}
                        
                        {/* Nội dung chuyển khoản */}
                        <div style={{
                            background: "#fff8e1",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "16px"
                        }}>
                            <p><strong>📝 Nội dung chuyển khoản:</strong></p>
                            <code style={{
                                background: "#e9ecef",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                display: "inline-block",
                                fontSize: "14px",
                                fontWeight: "bold",
                                marginTop: "8px"
                            }}>
                                {orderCode}
                            </code>
                            <button
                                onClick={() => copyToClipboard(orderCode, 'order')}
                                style={{
                                    marginLeft: "8px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#2e7d32"
                                }}
                            >
                                {copied ? <FaCheck /> : <FaCopy />}
                            </button>
                            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                                * Vui lòng nhập đúng nội dung để hệ thống xác nhận thanh toán tự động
                            </p>
                        </div>
                    </div>

                    {/* Lưu ý */}
                    <div style={{
                        background: "#fff3e0",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "24px"
                    }}>
                        <h4 style={{ color: "#ed6c02", marginBottom: "12px" }}>⚠️ Lưu ý:</h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                            <li>Sau khi chuyển khoản, vui lòng đợi 5-10 phút để hệ thống cập nhật</li>
                            <li>Vui lòng giữ lại ảnh chụp màn hình chuyển khoản để đối chiếu nếu cần</li>
                            <li>Đơn hàng sẽ được xử lý ngay sau khi xác nhận thanh toán</li>
                        </ul>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        {/* SỬA: Chuyển đến trang chi tiết đơn hàng với orderId */}
                        <button
                            onClick={() => navigate(`/orders/${orderId}`)}
                            style={{
                                flex: 1,
                                padding: "14px",
                                background: "#2e7d32",
                                color: "white",
                                border: "none",
                                borderRadius: "40px",
                                cursor: "pointer",
                                fontWeight: "600"
                            }}
                        >
                            Xem đơn hàng của tôi
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                flex: 1,
                                padding: "14px",
                                background: "white",
                                color: "#2e7d32",
                                border: "2px solid #2e7d32",
                                borderRadius: "40px",
                                cursor: "pointer",
                                fontWeight: "600"
                            }}
                        >
                            Tiếp tục mua sắm
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2e7d32;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
            `}</style>
        </ShopDetailLayout>
    );
};

export default PaymentInstructions;