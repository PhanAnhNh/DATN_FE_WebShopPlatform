// src/pages/user/account/signin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../../components/common/Toast';
import "../../../css/AdminManageLayout.css";

function Login() {
  const [email, setEmail] = useState("");
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
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Email hoặc mật khẩu không chính xác!");
      }

      const data = await response.json();
      console.log("User login response:", data);

      // Kiểm tra role - user không được đăng nhập vào shop hoặc admin
      if (data.user && data.user.role === "shop_owner") {
        throw new Error("Vui lòng đăng nhập qua cổng dành cho shop");
      }
      
      if (data.user && data.user.role === "admin") {
        throw new Error("Vui lòng đăng nhập qua cổng dành cho admin");
      }

      // Lưu token với key RIÊNG cho user
      localStorage.setItem("user_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Đăng nhập thành công!", "success");
      
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
      
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
      <div style={{ padding: "15px 30px", background: "white", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #ddd" }}>
        <img src="https://placehold.co/40x40/2e7d32/white?text=Logo" alt="Logo" style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0, color: "#2e7d32", fontSize: "20px" }}>Đặc Sản Quê Tôi</h2>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "#f5eee1", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        
        <div style={{ display: "flex", width: "100%", maxWidth: "900px", height: "80%", minHeight: "500px", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Cột trái: Form đăng nhập */}
          <div style={{ flex: 1, padding: "20px 50px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>Đăng nhập</h1>
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input
                type="text"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />
              
              <div>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                      fontSize: "18px",
                      userSelect: "none"
                    }}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </span>
                </div>

                <div style={{ textAlign: "right", marginTop: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#555", cursor: "pointer" }}>Quên mật khẩu</span>
                </div>
              </div>

              {error && <div style={{ color: "red", fontSize: "13px", textAlign: "center" }}>{error}</div>}

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
                  marginTop: "10px",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#333" }}>
              Chưa có tài khoản? 
              <span style={{ color: "#558b2f", fontWeight: "bold", cursor: "pointer", marginLeft: "5px" }}
                onClick={() => navigate("/register")}
              >Đăng kí</span>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ color: "#db4437", fontWeight: "bold", fontSize: "18px" }}>G</span>
                <span style={{ marginLeft: "5px" }}>Google</span>
              </button>
              <button style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ color: "#4267B2", fontWeight: "bold", fontSize: "18px" }}>f</span>
                <span style={{ marginLeft: "5px" }}>FaceBook</span>
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "auto", fontSize: "12px", color: "#777" }}>
              Chính sách | Điều khoản
            </div>
          </div>

          {/* Đường kẻ dọc phân cách */}
          <div style={{ width: "1px", height: "80%", backgroundColor: "#ccc", margin: "0 20px" }}></div>

          {/* Cột phải: Hình ảnh */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img 
              src="https://placehold.co/400x500/dcedc8/336600?text=Anh+Minh+Hoa" 
              alt="Illustration" 
              style={{ width: "90%", height: "90%", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;