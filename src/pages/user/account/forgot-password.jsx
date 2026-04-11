// src/pages/user/account/forgot-password.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../../components/common/Toast';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
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

      showToast(data.message, "success");
      
      // Lưu email để dùng cho các bước sau
      localStorage.setItem("reset_email", email);
      
      setTimeout(() => {
        navigate("/verify-otp");
      }, 1500);
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
            <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>Quên mật khẩu</h1>
            
            <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <p style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>
                Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu
              </p>
              
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: "15px", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: loading ? "#a5a5a5" : "#558b2f", 
                  color: "white", 
                  fontWeight: "bold", 
                  fontSize: "16px", 
                  cursor: loading ? "not-allowed" : "pointer", 
                  marginTop: "10px"
                }}
              >
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#333" }}>
              Nhớ mật khẩu? 
              <span style={{ color: "#558b2f", fontWeight: "bold", cursor: "pointer", marginLeft: "5px" }}
                onClick={() => navigate("/login")}
              >Đăng nhập</span>
            </div>
          </div>

          {/* Đường kẻ dọc phân cách */}
          <div style={{ width: "1px", height: "80%", backgroundColor: "#ccc", margin: "0 20px" }}></div>

          {/* Cột phải: Hình ảnh */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img 
              src="https://placehold.co/400x500/dcedc8/336600?text=Forgot+Password" 
              alt="Illustration" 
              style={{ width: "90%", height: "90%", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;