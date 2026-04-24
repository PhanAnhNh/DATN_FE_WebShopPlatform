// src/pages/admin/auth/AdminLogin.jsx (hoặc vị trí của bạn)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/common/Toast";
import "../../css/AdminManageLayout.css";
import { CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { adminApi } from '../../api/api';

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Toast states
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await adminApi.post("/api/v1/admin/login", {
      login_identifier: username,
      password: password
    });

    // ✅ Axios trả về data ở response.data
    const data = response.data;
    console.log("Admin login response:", data);

    if (response.status !== 200) {
      throw new Error(data.detail || "Đăng nhập thất bại");
    }

    // Kiểm tra role
    if (data.user && data.user.role !== "admin") {
      throw new Error("Tài khoản không phải là admin");
    }

    localStorage.setItem("admin_token", data.access_token);
    localStorage.setItem("admin_data", JSON.stringify(data.user));

    showToast("Đăng nhập Admin thành công!", "success");
    
    setTimeout(() => {
      navigate("/admin/dashboard");
    }, 1500);

  } catch (err) {
    console.error("Login error:", err);
    const errorMessage = err.response?.data?.detail || err.message || "Đăng nhập thất bại";
    setError(errorMessage);
    showToast(errorMessage, "error");
  } finally {
    setLoading(false);
  }
};

  const handleDemoLogin = () => {
    setUsername("admin");
    setPassword("admin123");
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      fontFamily: "Arial, sans-serif",
      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
    }}>
      
      {/* Toast Container */}
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
      <div style={{
        padding: "15px 30px",
        background: "white",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        borderBottom: "1px solid #ddd",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#2a5298",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white"
        }}>
          <Shield size={24} />
        </div>
        <h2 style={{ margin: 0, color: "#2a5298" }}>Đặc Sản Quê Tôi - ADMIN</h2>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{
          display: "flex",
          width: "900px",
          minHeight: "500px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden"
        }}>
          {/* Left Form */}
          <div style={{
            flex: 1,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#2a5298" }}>
              Admin Login
            </h2>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: "2px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                  outline: "none",
                  fontSize: "15px",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#2a5298"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "14px",
                    paddingRight: "45px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    backgroundColor: "#fafafa",
                    outline: "none",
                    fontSize: "15px",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#2a5298"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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

              {error && (
                <div style={{ 
                  color: "#f44336", 
                  fontSize: "14px", 
                  textAlign: "center",
                  padding: "10px",
                  background: "#ffebee",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px"
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px",
                  background: loading ? "#a5a5a5" : "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "10px",
                  transition: "all 0.3s",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Đang đăng nhập..." : "Login Admin"}
              </button>

              {/* Demo account info */}
              <div style={{
                marginTop: "20px",
                padding: "15px",
                background: "#f5f5f5",
                borderRadius: "10px",
                border: "1px dashed #2a5298"
              }}>
                <p style={{ fontSize: "13px", color: "#666", margin: "0 0 10px 0", fontWeight: "600" }}>
                  Tài khoản demo:
                </p>
                <p style={{ fontSize: "13px", margin: "5px 0", color: "#555" }}>
                  <span style={{ fontWeight: "600" }}>Username:</span> admin
                </p>
                <p style={{ fontSize: "13px", margin: "5px 0", color: "#555" }}>
                  <span style={{ fontWeight: "600" }}>Mật khẩu:</span> admin123
                </p>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    width: "100%",
                    background: "white",
                    border: "1px solid #2a5298",
                    borderRadius: "5px",
                    color: "#2a5298",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  Điền tài khoản demo
                </button>
              </div>
            </form>
          </div>

          {/* Right Image */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
          }}>
            <div style={{ textAlign: "center", color: "white", padding: "40px" }}>
              <Shield size={100} style={{ marginBottom: "20px", opacity: 0.9 }} />
              <h3 style={{ fontSize: "24px", marginBottom: "15px" }}>Quản trị hệ thống</h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6", opacity: 0.9 }}>
                Quản lý người dùng, cửa hàng,<br />
                sản phẩm và toàn bộ hệ thống
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "15px 30px",
        background: "white",
        textAlign: "center",
        borderTop: "1px solid #eee",
        fontSize: "13px",
        color: "#666"
      }}>
        © 2024 Đặc Sản Quê Tôi. Phiên bản dành cho Admin.
      </div>
    </div>
  );
}

export default AdminLogin;