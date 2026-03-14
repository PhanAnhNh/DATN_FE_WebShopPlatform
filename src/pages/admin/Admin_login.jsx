import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Toast"; // Import Toast
import "../../css/AdminManageLayout.css"; // Import CSS
import { CheckCircle, AlertCircle } from 'lucide-react'; // Import icons

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
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

  // src/pages/admin/auth/AdminLogin.jsx
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const response = await fetch("http://localhost:8000/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        login_identifier: username, 
        password: password
      })
    });

    const data = await response.json();
    console.log("Admin login response:", data);

    if (!response.ok) {
      throw new Error(data.detail || "Đăng nhập thất bại");
    }

    // Dùng key RIÊNG cho admin
    localStorage.setItem("admin_token", data.access_token); // Key riêng
    localStorage.setItem("admin_data", JSON.stringify(data.user)); // Key riêng

    showToast("Đăng nhập Admin thành công!", "success");
    
    setTimeout(() => {
      navigate("/admin/dashboard");
    }, 1500);

  } catch (err) {
    setError(err.message);
    showToast(err.message, "error");
  }
};

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial" }}>

      {/* Toast Container - Thêm vào đây */}
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
        borderBottom: "1px solid #ddd"
      }}>
        <img src="https://placehold.co/40x40/2e7d32/white?text=Logo" alt="Logo" style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0, color: "#2e7d32" }}>Đặc Sản Quê Tôi - ADMIN</h2>
      </div>

      {/* Main */}
      <div style={{
        flex: 1,
        backgroundColor: "#f5eee1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>

        <div style={{
          display: "flex",
          width: "900px",
          minHeight: "500px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
        }}>

          {/* Left Form */}
          <div style={{
            flex: 1,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>

            <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
              Admin Login
            </h2>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

              {/* USERNAME */}
              <input
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "#f1f1f1"
                }}
              />

              {/* PASSWORD */}
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
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background: "#f1f1f1"
                  }}
                />

                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>

              {/* Error message cũ - có thể giữ lại hoặc bỏ */}
              {error && (
                <div style={{ color: "red", fontSize: "14px" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                style={{
                  padding: "14px",
                  background: "#2e7d32",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Login Admin
              </button>

            </form>

          </div>

          {/* Right Image */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#e8f5e9"
          }}>
            <img
              src="https://placehold.co/350x450/4caf50/white?text=ADMIN"
              alt="admin"
              style={{
                width: "80%",
                borderRadius: "10px"
              }}
            />
          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminLogin;