// src/pages/shop/auth/ShopLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../components/common/Toast';
import "../../css/AdminManageLayout.css";
import { Store, Eye, EyeOff, AlertCircle } from 'lucide-react';

function ShopLogin() {
  const [loginIdentifier, setLoginIdentifier] = useState("");
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

  // Hàm hiển thị toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Tạo FormData cho OAuth2 form
      const formData = new URLSearchParams();
      formData.append('username', loginIdentifier);
      formData.append('password', password);

      const response = await fetch(`${BACKEND_URL}/api/v1/shop/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      const data = await response.json();
      console.log("Shop login response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Đăng nhập thất bại");
      }

      // Kiểm tra role có phải shop_owner không
      if (data.user && data.user.role !== "shop_owner") {
        throw new Error("Tài khoản không phải là chủ shop");
      }

      // Lưu token và user data với key RIÊNG cho shop
      localStorage.setItem("shop_token", data.access_token);
      localStorage.setItem("shop_data", JSON.stringify(data.user));
      
      // Lưu thông tin shop nếu có
      if (data.shop) {
        localStorage.setItem("shop_info", JSON.stringify(data.shop));
      }

      showToast("Đăng nhập vào trang quản lý shop thành công!", "success");
      
      setTimeout(() => {
        navigate("/shop/dashboard");
      }, 1500);

    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Hàm đăng nhập demo
  const handleDemoLogin = () => {
    setLoginIdentifier("shop1");
    setPassword("123456");
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      fontFamily: "Arial, sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
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
          background: "#667eea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white"
        }}>
          <Store size={24} />
        </div>
        <h2 style={{ margin: 0, color: "#667eea", fontSize: "20px" }}>
          Đặc Sản Quê Tôi - Quản lý Shop
        </h2>
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
          width: "100%", 
          maxWidth: "1000px", 
          height: "600px",
          background: "white", 
          borderRadius: "20px", 
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden"
        }}>
          
          {/* Left Panel - Form */}
          <div style={{ 
            flex: 1, 
            padding: "40px", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center",
            background: "white"
          }}>
            
            <div style={{ marginBottom: "30px" }}>
              <h1 style={{ 
                fontSize: "28px", 
                color: "#333", 
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <Store size={32} color="#667eea" />
                Đăng nhập quản lý shop
              </h1>
              <p style={{ color: "#666", fontSize: "14px" }}>
                Đăng nhập để quản lý cửa hàng, sản phẩm và đơn hàng của bạn
              </p>
            </div>
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Email/Username field */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "600",
                  color: "#555",
                  fontSize: "14px"
                }}>
                  Email hoặc tên đăng nhập
                </label>
                <input
                  type="text"
                  placeholder="Nhập email hoặc tên đăng nhập"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    backgroundColor: "#fafafa",
                    outline: "none",
                    fontSize: "15px",
                    transition: "all 0.3s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
              
              {/* Password field */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "600",
                  color: "#555",
                  fontSize: "14px"
                }}>
                  Mật khẩu
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
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
                      transition: "all 0.3s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
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
                      color: "#999"
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                <div style={{ textAlign: "right", marginTop: "10px" }}>
                  <span style={{ 
                    fontSize: "13px", 
                    color: "#667eea", 
                    cursor: "pointer",
                    fontWeight: "500"
                  }}>
                    Quên mật khẩu?
                  </span>
                </div>
              </div>

              {/* Error message */}
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

              {/* Login button */}
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: loading ? "#a5a5a5" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "10px",
                  transition: "all 0.3s",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập vào quản lý shop"}
              </button>

              {/* Demo account info */}
              <div style={{
                marginTop: "20px",
                padding: "15px",
                background: "#f5f5f5",
                borderRadius: "10px",
                border: "1px dashed #667eea"
              }}>
                <p style={{ 
                  fontSize: "13px", 
                  color: "#666",
                  margin: "0 0 10px 0",
                  fontWeight: "600"
                }}>
                  Tài khoản demo:
                </p>
                <p style={{ fontSize: "13px", margin: "5px 0", color: "#555" }}>
                  <span style={{ fontWeight: "600" }}>Username:</span> shop1
                </p>
                <p style={{ fontSize: "13px", margin: "5px 0", color: "#555" }}>
                  <span style={{ fontWeight: "600" }}>Mật khẩu:</span> 123456
                </p>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    width: "100%",
                    background: "white",
                    border: "1px solid #667eea",
                    borderRadius: "5px",
                    color: "#667eea",
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

          {/* Right Panel - Image & Info */}
          <div style={{ 
            flex: 1,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            color: "white"
          }}>
            <Store size={120} style={{ marginBottom: "30px", opacity: 0.9 }} />
            
            <h2 style={{ 
              fontSize: "28px", 
              marginBottom: "20px",
              textAlign: "center"
            }}>
              Quản lý cửa hàng của bạn
            </h2>
            
            <p style={{ 
              fontSize: "16px", 
              textAlign: "center",
              lineHeight: "1.6",
              opacity: 0.9
            }}>
              Đăng nhập để quản lý sản phẩm, theo dõi đơn hàng, 
              thống kê doanh thu và tương tác với khách hàng
            </p>

            <div style={{
              marginTop: "40px",
              display: "flex",
              gap: "20px"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>📦</div>
                <div style={{ fontSize: "14px", marginTop: "5px" }}>Quản lý sản phẩm</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>📊</div>
                <div style={{ fontSize: "14px", marginTop: "5px" }}>Thống kê doanh thu</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>📝</div>
                <div style={{ fontSize: "14px", marginTop: "5px" }}>Quản lý đơn hàng</div>
              </div>
            </div>

            <div style={{
              marginTop: "50px",
              padding: "20px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "10px",
              width: "100%"
            }}>
              <p style={{ fontSize: "14px", margin: "0", textAlign: "center" }}>
                "Quản lý cửa hàng hiệu quả, tăng doanh số bán hàng"
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
        © 2024 Đặc Sản Quê Tôi. Phiên bản dành cho chủ shop.
      </div>
    </div>
  );
}

export default ShopLogin;