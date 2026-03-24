// pages/user/payment/PaymentInstructions.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCopy, FaCheck, FaQrcode, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../../api/api';
import ShopDetailLayout from '../../../components/layout/ShopDetailLayout';

const PaymentInstructions = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/api/v1/orders/${orderId}`);
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    return (
        <ShopDetailLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                    <h1 style={{ fontSize: "24px", marginBottom: "24px", textAlign: "center" }}>
                        Hướng dẫn thanh toán
                    </h1>

                    <div style={{
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "24px"
                    }}>
                        <h3 style={{ marginBottom: "16px" }}>Thông tin đơn hàng</h3>
                        <p><strong>Mã đơn hàng:</strong> #{order?.id?.slice(-8).toUpperCase()}</p>
                        <p><strong>Số tiền cần thanh toán:</strong> <span style={{ color: "#d32f2f", fontSize: "20px", fontWeight: "bold" }}>{formatCurrency(order?.total_amount)}</span></p>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <h3 style={{ marginBottom: "16px" }}>Thông tin chuyển khoản</h3>
                        <div style={{
                            background: "#f8f9fa",
                            borderRadius: "12px",
                            padding: "20px"
                        }}>
                            <p><strong>Ngân hàng:</strong> Vietcombank</p>
                            <p><strong>Số tài khoản:</strong> 123456789</p>
                            <p><strong>Chủ tài khoản:</strong> CÔNG TY ĐẶC SẢN QUÊ TÔI</p>
                            <p><strong>Nội dung chuyển khoản:</strong> 
                                <code style={{
                                    background: "#e9ecef",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    marginLeft: "8px",
                                    display: "inline-block"
                                }}>
                                    {order?.id?.slice(-8).toUpperCase()}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(order?.id?.slice(-8).toUpperCase())}
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
                            </p>
                        </div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <h3 style={{ marginBottom: "16px" }}>QR Code thanh toán</h3>
                        <div style={{
                            textAlign: "center",
                            background: "#f8f9fa",
                            borderRadius: "12px",
                            padding: "20px"
                        }}>
                            <FaQrcode size={120} color="#2e7d32" />
                            <p style={{ marginTop: "12px", fontSize: "14px", color: "#666" }}>
                                Quét mã QR để thanh toán nhanh
                            </p>
                        </div>
                    </div>

                    <div style={{
                        background: "#fff3e0",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "24px"
                    }}>
                        <h4 style={{ color: "#ed6c02", marginBottom: "12px" }}>Lưu ý:</h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                            <li>Sau khi chuyển khoản, vui lòng đợi 5-10 phút để hệ thống cập nhật</li>
                            <li>Nếu quá thời gian trên chưa thấy cập nhật, vui lòng liên hệ hotline: 1900xxxx</li>
                            <li>Vui lòng giữ lại ảnh chụp màn hình chuyển khoản để đối chiếu nếu cần</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => navigate('/orders')}
                        style={{
                            width: "100%",
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
                </div>
            </div>
        </ShopDetailLayout>
    );
};

export default PaymentInstructions;