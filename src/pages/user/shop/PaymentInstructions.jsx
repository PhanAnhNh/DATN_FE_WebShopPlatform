import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCopy, FaCheck, FaBuilding, FaUser, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
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
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const pollingInterval = useRef(null);
    const [dynamicQrUrl, setDynamicQrUrl] = useState(null);
    const [qrLoading, setQrLoading] = useState(true);

    const shopId = location.state?.shopId;

    useEffect(() => {
        fetchOrderAndPaymentInfo();
        startPolling();
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [orderId]);

    useEffect(() => {
        if (order && order.payment_method === 'bank_transfer' && order.payment_status !== 'paid') {
            fetchDynamicQr();
        }
    }, [order]);

    const fetchDynamicQr = async () => {
        setQrLoading(true);
        try {
            const res = await api.get(`/api/v1/payments/generate-qr/${orderId}`);
            setDynamicQrUrl(res.data.qr_code_url);
        } catch (err) {
            console.error("Failed to get dynamic QR", err);
        } finally {
            setQrLoading(false);
        }
    };

    const startPolling = () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        pollingInterval.current = setInterval(async () => {
            if (paymentConfirmed) return;
            try {
                const response = await api.get(`/api/v1/orders/${orderId}`);
                if (response.data.payment_status === 'paid') {
                    setPaymentConfirmed(true);
                    clearInterval(pollingInterval.current);
                    setTimeout(() => {
                        navigate(`/orders/${orderId}`);
                    }, 2000);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 5000);
    };

    const fetchOrderAndPaymentInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            const orderResponse = await api.get(`/api/v1/orders/${orderId}`);
            const orderData = orderResponse.data;
            setOrder(orderData);
            
            let targetShopId = shopId;
            if (!targetShopId && orderData.items && orderData.items.length > 0) {
                targetShopId = orderData.items[0].shop_id;
            }
            
            if (targetShopId) {
                try {
                    const settingsResponse = await api.get(`/api/v1/shop/settings/public/${targetShopId}`);
                    setShopPaymentInfo(settingsResponse.data);
                } catch (settingsError) {
                    console.error('Error fetching shop settings:', settingsError);
                    setShopPaymentInfo({
                        shop_id: targetShopId,
                        shop_name: "Cửa hàng",
                        payment: { bank_accounts: [] }
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

                    {/* Mã QR động cho đơn hàng */}
                    {dynamicQrUrl ? (
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <h3>📱 Mã QR thanh toán (cho đơn hàng #{orderCode})</h3>
                            <img src={dynamicQrUrl} alt="QR Code" style={{ width: 200, height: 200, border: "1px solid #ddd", borderRadius: 12 }} />
                            <p style={{ fontSize: 13, marginTop: 8 }}>Quét mã bằng app ngân hàng, nội dung đã được điền sẵn mã đơn hàng.</p>
                        </div>
                    ) : qrLoading ? (
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <FaSpinner className="spinning" /> Đang tạo mã QR...
                        </div>
                    ) : (
                        <div style={{ background: "#fff3e0", padding: 12, borderRadius: 8, marginBottom: "24px" }}>
                            ⚠️ Không thể tạo mã QR, vui lòng chuyển khoản thủ công theo nội dung bên dưới.
                        </div>
                    )}

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
                                    <p><FaBuilding color="#2e7d32" /> <strong>Ngân hàng:</strong> {account.bank_name}</p>
                                    <p>
                                        <FaUser color="#2e7d32" /> <strong>Số tài khoản:</strong> 
                                        <code style={{ background: "#e9ecef", padding: "6px 12px", borderRadius: "6px", marginLeft: "8px" }}>
                                            {account.account_number}
                                        </code>
                                        <button onClick={() => copyToClipboard(account.account_number, 'account')}
                                            style={{ marginLeft: "8px", background: "#e8f5e9", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}>
                                            {copiedAccount ? <FaCheck /> : <FaCopy />} Sao chép
                                        </button>
                                    </p>
                                    <p><strong>Chủ tài khoản:</strong> {account.account_name}</p>
                                    {account.branch && <p><strong>Chi nhánh:</strong> {account.branch}</p>}
                                </div>
                            ))
                        ) : (
                            <div style={{ background: "#fff3e0", borderRadius: "12px", padding: "16px", textAlign: "center", color: "#e65100" }}>
                                <FaExclamationTriangle size={24} />
                                <p>Shop chưa cập nhật thông tin tài khoản ngân hàng.</p>
                            </div>
                        )}

                        {/* Nội dung chuyển khoản - fallback */}
                        <div style={{ background: "#fff8e1", borderRadius: "8px", padding: "12px", marginTop: "16px" }}>
                            <p><strong>📝 Nội dung chuyển khoản BẮT BUỘC:</strong></p>
                            <code style={{ background: "#e9ecef", padding: "8px 12px", borderRadius: "6px", display: "inline-block" }}>
                                {orderCode}
                            </code>
                            <button onClick={() => copyToClipboard(orderCode, 'order')} style={{ marginLeft: "8px" }}>
                                {copied ? <FaCheck /> : <FaCopy />}
                            </button>
                            <p style={{ fontSize: "12px", color: "#d32f2f", marginTop: "8px" }}>
                                * Sao chép nội dung trên và dán vào ô "Nội dung chuyển khoản" khi thanh toán.
                            </p>
                        </div>
                    </div>

                    {/* Trạng thái thanh toán */}
                    {paymentConfirmed ? (
                        <div style={{ background: "#e8f5e9", padding: "12px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
                            <FaCheck color="#2e7d32" size={20} /> Đã nhận được thanh toán! Chuyển đến đơn hàng...
                        </div>
                    ) : (
                        <div style={{ background: "#e3f2fd", padding: "12px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
                            <FaSpinner className="spinning" style={{ marginRight: 8 }} /> Đang chờ thanh toán...
                        </div>
                    )}

                    {/* Lưu ý */}
                    <div style={{ background: "#fff3e0", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
                        <h4 style={{ color: "#ed6c02", marginBottom: "12px" }}>⚠️ Lưu ý:</h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                            <li>Sau khi chuyển khoản, hệ thống sẽ tự động cập nhật trong vòng 30 giây</li>
                            <li>Vui lòng giữ lại ảnh chụp màn hình chuyển khoản để đối chiếu nếu cần</li>
                            <li>Đơn hàng sẽ được xử lý ngay sau khi xác nhận thanh toán</li>
                            <li>Không đóng trình duyệt cho đến khi thấy thông báo thành công</li>
                        </ul>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => navigate(`/orders/${orderId}`)}
                            style={{ flex: 1, padding: "14px", background: "#2e7d32", color: "white", border: "none", borderRadius: "40px", cursor: "pointer", fontWeight: "600" }}>
                            Xem đơn hàng của tôi
                        </button>
                        <button onClick={() => navigate('/')}
                            style={{ flex: 1, padding: "14px", background: "white", color: "#2e7d32", border: "2px solid #2e7d32", borderRadius: "40px", cursor: "pointer", fontWeight: "600" }}>
                            Tiếp tục mua sắm
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #2e7d32; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                .spinning { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </ShopDetailLayout>
    );
};

export default PaymentInstructions;