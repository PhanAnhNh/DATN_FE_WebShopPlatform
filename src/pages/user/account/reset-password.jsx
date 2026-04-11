// src/pages/user/account/reset-password.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../../components/common/Toast';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy email và OTP đã xác thực từ localStorage
    const savedEmail = localStorage.getItem("reset_email");
    const savedOTP = localStorage.getItem("verified_otp");
    
    if (!savedEmail || !savedOTP) {
      navigate("/forgot-password");
      return;
    }
    
    setEmail(savedEmail);
    setOtpCode(savedOTP);
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    if (newPassword.length > 50) {
      showToast("Mật khẩu không được vượt quá 50 ký tự", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/password/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp_code: otpCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Có lỗi xảy ra");
      }

      showToast("Đặt lại mật khẩu thành công!", "success");
      
      // Xóa dữ liệu tạm
      localStorage.removeItem("reset_email");
      localStorage.removeItem("verified_otp");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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
            <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>Đặt lại mật khẩu mới</h1>
            
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <p style={{ textAlign: "center", color: "#666", marginBottom: "10px" }}>
                Tạo mật khẩu mới cho tài khoản <strong>{email}</strong>
              </p>

              <div>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "15px", 
                      paddingRight: "45px",
                      borderRadius: "8px", 
                      border: "1px solid #ccc", 
                      backgroundColor: "#e9ecef", 
                      outline: "none", 
                      boxSizing: "border-box" 
                    }}
                  />
                  <span 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: "absolute", 
                      right: "15px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      cursor: "pointer",
                      fontSize: "18px"
                    }}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                  Mật khẩu phải có ít nhất 6 ký tự
                </div>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ padding: "15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />

              <button 
                type="submit" 
                disabled={loading || !newPassword || !confirmPassword}
                style={{ 
                  padding: "15px", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: (loading || !newPassword || !confirmPassword) ? "#a5a5a5" : "#558b2f", 
                  color: "white", 
                  fontWeight: "bold", 
                  fontSize: "16px", 
                  cursor: (loading || !newPassword || !confirmPassword) ? "not-allowed" : "pointer", 
                  marginTop: "10px"
                }}
              >
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/verify-otp")}
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
              src="https://placehold.co/400x500/dcedc8/336600?text=Reset+Password" 
              alt="Illustration" 
              style={{ width: "90%", height: "90%", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;