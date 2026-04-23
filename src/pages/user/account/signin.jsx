// src/pages/user/account/signin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../../components/common/Toast';
import "../../../css/AdminManageLayout.css";
import userApi from '../../../api/api';

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

    // DÙNG userApi (axios) - KHÔNG cần .json()
    const response = await userApi.post("/api/v1/auth/login", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // VỚI AXIOS: data nằm trong response.data, KHÔNG cần response.json()
    const data = response.data;
    console.log("User login response:", data);

    // Kiểm tra role
    if (data.user && data.user.role === "shop_owner") {
      throw new Error("Vui lòng đăng nhập qua cổng dành cho shop");
    }
    
    if (data.user && data.user.role === "admin") {
      throw new Error("Vui lòng đăng nhập qua cổng dành cho admin");
    }

    // Lưu token
    localStorage.setItem("user_token", data.access_token);
    localStorage.setItem("user_data", JSON.stringify(data.user));
    localStorage.setItem("user", JSON.stringify(data.user));

    showToast("Đăng nhập thành công!", "success");
    
    setTimeout(() => {
      navigate("/");
    }, 1500);

  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || "Đăng nhập thất bại";
    setError(errorMsg);
    showToast(errorMsg, "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      {/* Background Image */}
      <div style={styles.backgroundImage}></div>
      <div style={styles.overlay}></div>
      
      {/* Toast Container */}
      {toast.show && (
        <div className="toast-container" style={styles.toastContainer}>
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      {/* Floating Form Container */}
      <div style={styles.formContainer}>
        <div style={styles.card}>
          {/* Close Button */}
          <button style={styles.closeBtn} onClick={() => navigate("/")}>✕</button>
          
          {/* Logo & Header */}
          <div style={styles.header}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoIcon}>🌾</div>
              <h1 style={styles.logoText}>Đặc Sản Quê Tôi</h1>
            </div>
            <p style={styles.welcomeBack}>Chào mừng trở lại</p>
            <h2 style={styles.loginTitle}>Đăng nhập</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Email <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="text"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mật khẩu <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div style={styles.forgotPassword}>
              <span 
                onClick={() => navigate("/forgot-password")}
                style={styles.forgotLink}
              >
                Quên mật khẩu?
              </span>
            </div>

            {error && <div style={styles.errorMessage}>{error}</div>}

            <button 
              type="submit" 
              disabled={loading}
              style={{...styles.submitBtn, ...(loading && styles.submitBtnDisabled)}}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>

            <div style={styles.registerRedirect}>
              Chưa có tài khoản? 
              <span 
                onClick={() => navigate("/register")}
                style={styles.registerLink}
              >
                Đăng ký ngay
              </span>
            </div>

            <div style={styles.divider}>
              <span style={styles.dividerLine}></span>
              <span style={styles.dividerText}>Hoặc đăng nhập với</span>
              <span style={styles.dividerLine}></span>
            </div>

            <div style={styles.socialButtons}>
              <button 
                type="button"
                style={styles.socialBtn}
                onClick={() => {/* TODO: Implement Google login */}}
              >
                <span style={styles.googleIcon}>G</span>
                <span>Google</span>
              </button>
              <button 
                type="button"
                style={styles.socialBtn}
                onClick={() => {/* TODO: Implement Facebook login */}}
              >
                <span style={styles.fbIcon}>f</span>
                <span>Facebook</span>
              </button>
            </div>
          </form>

          <div style={styles.footer}>
            <span style={styles.footerLink}>Chính sách bảo mật</span>
            <span style={styles.footerDot}>•</span>
            <span style={styles.footerLink}>Điều khoản sử dụng</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  
  backgroundImage: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 0,
  },
  
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 100%)",
    zIndex: 1,
  },
  
  toastContainer: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 1000,
  },
  
  formContainer: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "480px",
    margin: "0 auto",
  },
  
  card: {
    backgroundColor: "white",
    borderRadius: "32px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
    overflow: "hidden",
    padding: "40px 45px",
    position: "relative",
    animation: "slideUp 0.5s ease-out",
  },
  
  closeBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    color: "#666",
    zIndex: 10,
    ":hover": {
      backgroundColor: "#e0e0e0",
      transform: "rotate(90deg)",
    },
  },
  
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  
  logoIcon: {
    fontSize: "40px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
  },
  
  logoText: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  
  welcomeBack: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "8px",
  },
  
  loginTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1a1a2e",
    margin: 0,
  },
  
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  
  required: {
    color: "#e74c3c",
  },
  
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "16px",
    color: "#999",
    pointerEvents: "none",
  },
  
  input: {
    width: "100%",
    padding: "13px 45px 13px 42px",
    borderRadius: "14px",
    border: "1.5px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    fontFamily: "inherit",
    backgroundColor: "#fafafa",
    ":focus": {
      borderColor: "#667eea",
      backgroundColor: "white",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
    },
  },
  
  passwordToggle: {
    position: "absolute",
    right: "14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    transition: "color 0.2s",
  },
  
  forgotPassword: {
    textAlign: "right",
    marginTop: "-8px",
  },
  
  forgotLink: {
    fontSize: "12px",
    color: "#667eea",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.2s",
    ":hover": {
      color: "#764ba2",
      textDecoration: "underline",
    },
  },
  
  errorMessage: {
    padding: "12px",
    backgroundColor: "#fee",
    color: "#e74c3c",
    borderRadius: "12px",
    fontSize: "13px",
    textAlign: "center",
    border: "1px solid #fcc",
  },
  
  submitBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "8px",
    position: "relative",
    overflow: "hidden",
  },
  
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid white",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
    marginRight: "8px",
    verticalAlign: "middle",
  },
  
  registerRedirect: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
  },
  
  registerLink: {
    color: "#667eea",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "5px",
    transition: "color 0.2s",
    ":hover": {
      color: "#764ba2",
    },
  },
  
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "8px 0",
  },
  
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e0e0e0",
  },
  
  dividerText: {
    fontSize: "12px",
    color: "#999",
  },
  
  socialButtons: {
    display: "flex",
    gap: "12px",
  },
  
  socialBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "1.5px solid #e0e0e0",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s",
    color: "#555",
    ":hover": {
      backgroundColor: "#fafafa",
      borderColor: "#667eea",
      transform: "translateY(-1px)",
    },
  },
  
  googleIcon: {
    width: "20px",
    height: "20px",
    backgroundColor: "#db4437",
    color: "white",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  
  fbIcon: {
    width: "20px",
    height: "20px",
    backgroundColor: "#4267B2",
    color: "white",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #f0f0f0",
  },
  
  footerLink: {
    fontSize: "11px",
    color: "#999",
    cursor: "pointer",
    transition: "color 0.2s",
    ":hover": {
      color: "#667eea",
    },
  },
  
  footerDot: {
    fontSize: "11px",
    color: "#ccc",
  },
};

// Add animations to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  input:focus {
    border-color: #667eea !important;
    background-color: white !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }
  
  @media (max-width: 640px) {
    .card {
      padding: 30px 25px !important;
    }
    
    .logo-text {
      font-size: 18px !important;
    }
    
    .login-title {
      font-size: 24px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Login;