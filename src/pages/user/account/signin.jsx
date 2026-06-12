// src/pages/user/account/signin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import Toast from '../../../components/common/Toast';
import "../../../css/AdminManageLayout.css";
import userApi from '../../../api/api';

const GOOGLE_CLIENT_ID = "298767992144-us7ot1ggmedj7t5092lhvueu0pr1ht2g.apps.googleusercontent.com";

function LoginContent() {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
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
      formData.append("username", loginInput);
      formData.append("password", password);

      const response = await userApi.post("/api/v1/auth/login", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = response.data;

      localStorage.setItem("user_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Đăng nhập thành công!", "success");
      
      setTimeout(() => {
        const userRole = data.user?.role;
        if (userRole === "admin") {
          navigate("/");
        } else if (userRole === "shop_owner") {
          navigate("/");
        } else {
          navigate("/");
        }
      }, 1500);

    } catch (err) {
      // ✅ XỬ LÝ LỖI ĐẸP - KHÔNG HIỂN THỊ MÃ LỖI 400
      let errorMsg = "Đăng nhập thất bại";
      
      // Lấy message từ response
      const serverDetail = err.response?.data?.detail;
      const serverMessage = err.response?.data?.message;
      
      // Kiểm tra các trường hợp lỗi cụ thể
      if (err.response?.status === 400) {
        if (serverDetail === "Incorrect username or password" || 
            serverDetail === "Incorrect email or password" ||
            serverDetail?.toLowerCase().includes("incorrect")) {
          errorMsg = "Sai email/tên đăng nhập hoặc mật khẩu. Vui lòng thử lại.";
        } else if (serverDetail === "User not found" || serverDetail?.toLowerCase().includes("not found")) {
          errorMsg = "Tài khoản không tồn tại. Vui lòng kiểm tra lại email/tên đăng nhập.";
        } else if (serverDetail === "Account is not active" || serverDetail?.toLowerCase().includes("active")) {
          errorMsg = "Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để xác thực.";
        } else if (serverDetail === "Account is locked" || serverDetail?.toLowerCase().includes("lock")) {
          errorMsg = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.";
        } else if (serverMessage) {
          errorMsg = serverMessage;
        } else if (typeof serverDetail === "string") {
          errorMsg = serverDetail;
        } else {
          errorMsg = "Sai email/tên đăng nhập hoặc mật khẩu.";
        }
      } else if (err.response?.status === 401) {
        errorMsg = "Không có quyền truy cập. Vui lòng kiểm tra lại thông tin đăng nhập.";
      } else if (err.response?.status === 403) {
        errorMsg = "Bạn không có quyền truy cập vào hệ thống.";
      } else if (err.response?.status === 404) {
        errorMsg = "Không tìm thấy tài khoản. Vui lòng kiểm tra lại.";
      } else if (err.response?.status === 429) {
        errorMsg = "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 5 phút.";
      } else if (err.response?.status >= 500) {
        errorMsg = "Lỗi máy chủ. Vui lòng thử lại sau.";
      } else if (err.message && err.message !== "Request failed with status code 400") {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        
        const { email, name, picture, sub: googleId } = userInfo;
        
        const response = await userApi.post("/api/v1/auth/google-login", {
          email: email,
          full_name: name,
          avatar_url: picture,
          google_id: googleId
        });
        
        const data = response.data;
        
        localStorage.setItem("user_token", data.access_token);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        localStorage.setItem("user", JSON.stringify(data.user));
        
        showToast("Đăng nhập với Google thành công!", "success");
        
        setTimeout(() => {
          const userRole = data.user?.role;
          if (userRole === "admin") {
            navigate("/admin");
          } else if (userRole === "shop_owner") {
            navigate("/shop/dashboard");
          } else {
            navigate("/");
          }
        }, 1500);
        
      } catch (err) {
        // ✅ XỬ LÝ LỖI GOOGLE ĐẸP
        let errorMsg = "Đăng nhập với Google thất bại";
        
        if (err.response?.status === 400) {
          const serverDetail = err.response?.data?.detail;
          if (serverDetail?.toLowerCase().includes("email")) {
            errorMsg = "Email từ Google không hợp lệ hoặc đã được sử dụng.";
          } else if (serverDetail?.toLowerCase().includes("account")) {
            errorMsg = "Tài khoản Google chưa được đăng ký. Vui lòng đăng ký trước.";
          } else if (serverDetail) {
            errorMsg = serverDetail;
          } else {
            errorMsg = "Không thể đăng nhập bằng Google. Vui lòng thử lại.";
          }
        } else if (err.response?.status === 409) {
          errorMsg = "Email đã tồn tại. Vui lòng đăng nhập bằng mật khẩu.";
        } else if (err.response?.status >= 500) {
          errorMsg = "Lỗi máy chủ. Vui lòng thử lại sau.";
        }
        
        setError(errorMsg);
        showToast(errorMsg, "error");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Đăng nhập với Google thất bại, vui lòng thử lại");
      showToast("Đăng nhập với Google thất bại, vui lòng thử lại", "error");
      setGoogleLoading(false);
    }
  });

  return (
    <div style={styles.container}>
      <div style={styles.backgroundImage}></div>
      <div style={styles.overlay}></div>
      
      {toast.show && (
        <div className="toast-container" style={styles.toastContainer}>
          <Toast 
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        </div>
      )}

      <div style={styles.formContainer}>
        <div style={styles.card}>
          <button style={styles.closeBtn} onClick={() => navigate("/")}>✕</button>
          
          <div style={styles.header}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoIcon}>🌾</div>
              <h1 style={styles.logoText}>Đặc Sản Quê Tôi</h1>
            </div>
            <p style={styles.welcomeBack}>Chào mừng trở lại</p>
            <h2 style={styles.loginTitle}>Đăng nhập</h2>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Email hoặc Tên đăng nhập <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  placeholder="example@email.com hoặc username"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
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

            {/* ✅ HIỂN THỊ LỖI DẠNG ĐẸP */}
            {error && (
              <div style={styles.errorMessage}>
                <span style={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

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
                className="social-btn"
                style={styles.socialBtn}
                onClick={() => loginGoogle()}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <>
                    <span style={styles.spinnerDark}></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={styles.socialIcon} />
                    <span>Tiếp tục với Google</span>
                  </>
                )}
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

function Login() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginContent />
    </GoogleOAuthProvider>
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
  },
  
  errorMessage: {
    padding: "12px 16px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    borderRadius: "12px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #fecaca",
  },
  
  errorIcon: {
    fontSize: "16px",
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
  
  spinnerDark: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid #666",
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
    flexDirection: "column",
    gap: "12px",
  },
  
  socialBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "1.5px solid #e0e0e0",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    transition: "all 0.2s",
    color: "#333",
  },
  
  socialIcon: {
    width: "22px",
    height: "22px",
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
  },
  
  footerDot: {
    fontSize: "11px",
    color: "#ccc",
  },
};

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
  
  .social-btn:hover {
    background-color: #f9f9f9 !important;
    border-color: #d0d0d0 !important;
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