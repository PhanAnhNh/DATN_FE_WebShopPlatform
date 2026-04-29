import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCopy, FaCheck, FaBuilding, FaCheckCircle, FaUser, FaExclamationTriangle, FaSpinner, FaSyncAlt, FaQrcode, FaClock } from 'react-icons/fa';
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
  const [copiedOrderCode, setCopiedOrderCode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const pollingInterval = useRef(null);
  const countdownInterval = useRef(null);
  const [dynamicQrUrl, setDynamicQrUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const shopId = location.state?.shopId;
  const orderCode = order?._id?.slice(-8).toUpperCase();

  useEffect(() => {
    fetchOrderAndPaymentInfo();
    startPolling();
    startCountdown();
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [orderId]);

  useEffect(() => {
    if (order && (order.payment_method === 'bank' || order.payment_method === 'bank_transfer') && order.payment_status !== 'paid') {
      fetchDynamicQr();
    }
  }, [order]);

  const startCountdown = () => {
    const expiresIn = 15 * 60; // 15 phút
    setCountdown(expiresIn);
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchDynamicQr = async (isRetry = false) => {
    if (qrLoading) return;
    setQrLoading(true);
    setQrError(false);
    try {
      const res = await api.get(`/api/v1/payments/generate-qr/${orderId}`);
      if (res.data && res.data.qr_code_url) {
        setDynamicQrUrl(res.data.qr_code_url);
        retryCount.current = 0;
      } else {
        throw new Error('Không nhận được URL QR');
      }
    } catch (err) {
      console.error("Failed to get dynamic QR", err);
      if (!isRetry && retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(() => fetchDynamicQr(true), 2000);
      } else {
        setQrError(true);
      }
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
          setTimeout(() => navigate(`/orders/${orderId}`), 2000);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);
  };

  const fetchOrderAndPaymentInfo = async () => {
    try {
      setLoading(true);
      const orderResponse = await api.get(`/api/v1/orders/${orderId}`);
      const orderData = orderResponse.data;
      setOrder(orderData);
      
      let targetShopId = shopId;
      if (!targetShopId && orderData.items?.length > 0) {
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
      setCopiedAccount(text);
      setTimeout(() => setCopiedAccount(null), 2000);
    } else {
      setCopiedOrderCode(true);
      setTimeout(() => setCopiedOrderCode(false), 2000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  if (loading) {
    return (
      <ShopDetailLayout>
        <div style={{ textAlign: "center", padding: "80px" }}>
          <div className="spinner"></div>
          <p>Đang tải thông tin thanh toán...</p>
        </div>
      </ShopDetailLayout>
    );
  }

  if (error) {
    return (
      <ShopDetailLayout>
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "40px", textAlign: "center" }}>
          <div style={{ background: "#ffebee", borderRadius: "16px", padding: "32px" }}>
            <FaExclamationTriangle size={48} color="#f44336" />
            <h2 style={{ color: "#d32f2f" }}>Có lỗi xảy ra</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/orders')} className="back-btn">Quay lại đơn hàng</button>
          </div>
        </div>
      </ShopDetailLayout>
    );
  }

  const bankAccounts = shopPaymentInfo?.payment?.bank_accounts || [];

  return (
    <ShopDetailLayout>
      <div className="payment-instructions-container">
        <button onClick={() => navigate('/orders')} className="back-button">
          ← Quay lại danh sách đơn hàng
        </button>

        <div className="instructions-card">
          <h1>Hướng dẫn thanh toán</h1>
          <p className="subtitle">Vui lòng chuyển khoản theo thông tin bên dưới</p>

          {/* Countdown Timer */}
          {!paymentConfirmed && countdown > 0 && (
            <div className="countdown-timer">
              <FaClock /> Thời gian còn lại để thanh toán: <strong>{formatCountdown(countdown)}</strong>
            </div>
          )}

          {/* Order Info */}
          <div className="order-info-box">
            <h3>📋 Thông tin đơn hàng</h3>
            <div className="order-info-row"><strong>Mã đơn hàng:</strong> <span className="order-code-display">#{orderCode}</span></div>
            <div className="order-info-row"><strong>Người nhận:</strong> {order?.shipping_address_details?.name || order?.shipping_address?.split(',')[0]}</div>
            <div className="order-info-row"><strong>Số điện thoại:</strong> {order?.shipping_address_details?.phone}</div>
            <div className="order-info-row"><strong>Địa chỉ:</strong> {order?.shipping_address}</div>
            <div className="order-info-row amount"><strong>Số tiền cần thanh toán:</strong> <span className="amount-value">{formatCurrency(order?.total_amount)}</span></div>
          </div>

          {/* QR Code Section */}
          <div className="qr-section">
            <h3><FaQrcode /> Quét mã QR để thanh toán</h3>
            
            {dynamicQrUrl ? (
              <div className="qr-container">
                <img src={dynamicQrUrl} alt="QR Code thanh toán" className="qr-image" onError={() => setQrError(true)} />
                <p className="qr-note">Quét mã bằng app ngân hàng, nội dung đã được điền sẵn mã đơn hàng <strong>{orderCode}</strong></p>
              </div>
            ) : qrLoading ? (
              <div className="qr-loading"><FaSpinner className="spinning" /> Đang tạo mã QR...</div>
            ) : qrError ? (
              <div className="qr-error">
                <FaExclamationTriangle size={24} color="#ed6c02" />
                <p>Không thể tạo mã QR tự động</p>
                <button onClick={() => fetchDynamicQr()} className="retry-btn"><FaSyncAlt /> Thử lại</button>
                <p className="fallback-note">Vui lòng chuyển khoản thủ công theo nội dung bên dưới</p>
              </div>
            ) : (
              <div className="qr-placeholder">Đang chuẩn bị mã QR...</div>
            )}
          </div>

          {/* Bank Account Info */}
          <div className="bank-info-section">
            <h3>🏦 Thông tin tài khoản thụ hưởng</h3>
            
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account, idx) => (
                <div key={account.id} className="bank-account-card">
                  <p><FaBuilding /> <strong>Ngân hàng:</strong> {account.bank_name}</p>
                  <p><FaUser /> <strong>Số tài khoản:</strong> 
                    <code>{account.account_number}</code>
                    <button onClick={() => copyToClipboard(account.account_number, 'account')} className="copy-btn">
                      {copiedAccount === account.account_number ? <FaCheck /> : <FaCopy />} Sao chép
                    </button>
                  </p>
                  <p><strong>Chủ tài khoản:</strong> {account.account_name}</p>
                  {account.branch && <p><strong>Chi nhánh:</strong> {account.branch}</p>}
                </div>
              ))
            ) : (
              <div className="no-bank-warning">
                <FaExclamationTriangle size={24} />
                <p>Shop chưa cập nhật thông tin tài khoản ngân hàng. Vui lòng liên hệ shop để được hỗ trợ.</p>
              </div>
            )}

            
            <div style={{ background: "#fff8e1", borderRadius: "8px", padding: "12px", marginTop: "16px" }}>
                <p><strong>📝 Nội dung chuyển khoản BẮT BUỘC:</strong></p>
                <code style={{ background: "#e9ecef", padding: "8px 12px", borderRadius: "6px", display: "inline-block" }}>
                    SEVQR {orderCode}
                </code>
                <button onClick={() => copyToClipboard(`SEVQR ${orderCode}`, 'order')} style={{ marginLeft: "8px" }}>
                    {copiedOrderCode ? <FaCheck /> : <FaCopy />}
                </button>
                <p style={{ fontSize: "12px", color: "#d32f2f", marginTop: "12px" }}>
                    ⚠️ <strong>BẮT BUỘC:</strong> Nội dung phải bắt đầu bằng <strong>SEVQR</strong> (viết hoa)
                    <br />Ví dụ: <code>SEVQR {orderCode}</code>
                </p>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`payment-status ${paymentConfirmed ? 'success' : 'pending'}`}>
            {paymentConfirmed ? (
              <>
                <FaCheckCircle size={20} /> Đã nhận được thanh toán! Chuyển đến đơn hàng...
              </>
            ) : (
              <>
                <FaSpinner className="spinning" /> Đang chờ thanh toán...
              </>
            )}
          </div>

          {/* Important Notes */}
          <div className="notes-box">
            <h4>⚠️ Lưu ý quan trọng:</h4>
            <ul>
              <li>Sau khi chuyển khoản, hệ thống sẽ tự động cập nhật trong vòng 30-60 giây</li>
              <li>Vui lòng giữ lại ảnh chụp màn hình chuyển khoản để đối chiếu nếu cần</li>
              <li>Đơn hàng sẽ được xử lý ngay sau khi xác nhận thanh toán thành công</li>
              <li>Không đóng trình duyệt cho đến khi thấy thông báo thành công</li>
              <li>Nếu sau 5 phút chưa nhận được xác nhận, vui lòng liên hệ hotline hỗ trợ</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate(`/orders/${orderId}`)} className="view-order-btn">
              Xem đơn hàng của tôi
            </button>
            <button onClick={() => navigate('/')} className="continue-shopping-btn">
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2e7d32;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        .payment-instructions-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #2e7d32;
          cursor: pointer;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .instructions-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        h1 { font-size: 28px; text-align: center; margin-bottom: 8px; color: #333; }
        .subtitle { text-align: center; color: #666; margin-bottom: 24px; }
        
        .countdown-timer {
          background: #fff3e0;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 14px;
        }
        .countdown-timer strong { color: #ed6c02; font-size: 18px; margin-left: 8px; }
        
        .order-info-box {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .order-info-box h3 { margin-bottom: 16px; }
        .order-info-row { margin-bottom: 8px; font-size: 14px; }
        .order-code-display { font-family: monospace; font-weight: bold; color: #2e7d32; }
        .order-info-row.amount { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0; }
        .amount-value { color: #d32f2f; font-size: 20px; font-weight: bold; }
        
        .qr-section { text-align: center; margin-bottom: 24px; }
        .qr-section h3 { margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .qr-container { text-align: center; }
        .qr-image { width: 220px; height: 220px; border: 2px solid #e0e0e0; border-radius: 16px; padding: 8px; }
        .qr-note { font-size: 13px; color: #666; margin-top: 12px; }
        .qr-loading, .qr-error, .qr-placeholder { padding: 40px; text-align: center; background: #f8f9fa; border-radius: 16px; }
        .retry-btn { background: #2e7d32; color: white; border: none; padding: 8px 16px; border-radius: 30px; cursor: pointer; margin-top: 12px; display: inline-flex; align-items: center; gap: 6px; }
        .fallback-note { font-size: 12px; color: #999; margin-top: 16px; }
        
        .bank-info-section { margin-bottom: 24px; }
        .bank-info-section h3 { margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .bank-account-card {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .bank-account-card p { margin-bottom: 12px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .bank-account-card code { background: #e9ecef; padding: 6px 12px; border-radius: 8px; font-family: monospace; }
        .copy-btn {
          background: #e8f5e9;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        
        .no-bank-warning {
          background: #fff3e0;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          color: #e65100;
        }
        
        .transfer-content-box {
          background: #e8f5e9;
          border-radius: 16px;
          padding: 20px;
          margin-top: 16px;
        }
        .transfer-code {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
        }
        .transfer-code code {
          background: #2e7d32;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
        }
        .warning-text { font-size: 12px; color: #d32f2f; margin-top: 8px; line-height: 1.5; }
        
        .payment-status {
          padding: 14px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .payment-status.pending { background: #e3f2fd; color: #1976d2; }
        .payment-status.success { background: #e8f5e9; color: #2e7d32; }
        
        .notes-box {
          background: #fff8e1;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .notes-box h4 { color: #ed6c02; margin-bottom: 12px; }
        .notes-box ul { margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.6; }
        
        .action-buttons {
          display: flex;
          gap: 12px;
        }
        .view-order-btn, .continue-shopping-btn {
          flex: 1;
          padding: 14px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          text-align: center;
        }
        .view-order-btn {
          background: #2e7d32;
          color: white;
          border: none;
        }
        .continue-shopping-btn {
          background: white;
          color: #2e7d32;
          border: 2px solid #2e7d32;
        }
        .back-btn {
          padding: 10px 24px;
          background: #2e7d32;
          color: white;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          margin-top: 16px;
        }
        
        @media (max-width: 600px) {
          .instructions-card { padding: 20px; }
          h1 { font-size: 24px; }
          .action-buttons { flex-direction: column; }
        }
      `}</style>
    </ShopDetailLayout>
  );
};

export default PaymentInstructions;