// src/pages/user/account/verify-otp.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../../components/common/Toast';

function VerifyOTP() {
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút = 300 giây
  const [canResend, setCanResend] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy email từ localStorage
    const savedEmail = localStorage.getItem("reset_email");
    if (!savedEmail) {
      navigate("/forgot-password");
      return;
    }
    setEmail(savedEmail);

    // Bộ đếm thời gian OTP
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      showToast("Vui lòng nhập đủ 6 số OTP", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/password/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp_code: otpCode,
          otp_type: "forgot_password"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Mã OTP không hợp lệ");
      }

      showToast("Xác thực OTP thành công!", "success");
      
      // Lưu OTP đã xác thực để dùng cho bước đổi mật khẩu
      localStorage.setItem("verified_otp", otpCode);
      
      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/password/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Có lỗi xảy ra");
      }

      showToast("Đã gửi lại mã OTP mới!", "success");
      
      // Reset timer
      setTimeLeft(300);
      setCanResend(false);
      setOtpCode("");
      
      // Bắt đầu lại bộ đếm
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
      
      {toast.show && (
        <div className="toast-container">
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "15px 30px", background: "white", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #ddd" }}>
        <img src="https://placehold.co/40x40/2e7d32/white?text=Logo" alt="Logo" style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0, color: "#2e7d32", fontSize: "20px" }}>Đặc Sản Quê Tôi</h2>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "#f5eee1", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        
        <div style={{ display: "flex", width: "100%", maxWidth: "900px", height: "80%", minHeight: "500px", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Cột trái: Form */}
          <div style={{ flex: 1, padding: "20px 50px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>Xác nhận mã OTP</h1>
            
            <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <p style={{ textAlign: "center", color: "#666", marginBottom: "10px" }}>
                Mã OTP đã được gửi đến email <strong>{email}</strong>
              </p>

              <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <span style={{ 
                  display: "inline-block", 
                  padding: "8px 16px", 
                  backgroundColor: "#e9ecef", 
                  borderRadius: "20px",
                  fontSize: "14px",
                  color: "#558b2f",
                  fontWeight: "bold"
                }}>
                  ⏱️ OTP hết hạn sau: {formatTime(timeLeft)}
                </span>
              </div>

              <input
                type="text"
                placeholder="Nhập mã OTP (6 số)"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength="6"
                style={{ 
                  padding: "15px", 
                  borderRadius: "8px", 
                  border: "1px solid #ccc", 
                  backgroundColor: "#e9ecef", 
                  outline: "none", 
                  textAlign: "center", 
                  fontSize: "24px", 
                  letterSpacing: "10px",
                  fontWeight: "bold"
                }}
              />

              <button 
                type="submit" 
                disabled={loading || otpCode.length !== 6}
                style={{ 
                  padding: "15px", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: (loading || otpCode.length !== 6) ? "#a5a5a5" : "#558b2f", 
                  color: "white", 
                  fontWeight: "bold", 
                  fontSize: "16px", 
                  cursor: (loading || otpCode.length !== 6) ? "not-allowed" : "pointer", 
                  marginTop: "10px"
                }}
              >
                {loading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || loading}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "white",
                  cursor: (!canResend || loading) ? "not-allowed" : "pointer",
                  marginTop: "10px",
                  opacity: (!canResend || loading) ? 0.6 : 1
                }}
              >
                {!canResend ? `Gửi lại sau ${formatTime(timeLeft)}` : "Gửi lại mã OTP"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "white",
                  cursor: "pointer",
                  marginTop: "10px"
                }}
              >
                ← Quay lại
              </button>
            </form>
          </div>

          {/* Đường kẻ dọc phân cách */}
          <div style={{ width: "1px", height: "80%", backgroundColor: "#ccc", margin: "0 20px" }}></div>

          {/* Cột phải: Hình ảnh */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img 
              src="https://placehold.co/400x500/dcedc8/336600?text=Verify+OTP" 
              alt="Illustration" 
              style={{ width: "90%", height: "90%", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;