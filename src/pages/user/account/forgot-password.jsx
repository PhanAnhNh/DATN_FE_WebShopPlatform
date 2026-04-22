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
          <button style={styles.closeBtn} onClick={() => navigate("/login")}>✕</button>
          
          {/* Logo & Header */}
          <div style={styles.header}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoIcon}>🔐</div>
              <h1 style={styles.logoText}>Đặc Sản Quê Tôi</h1>
            </div>
            <p style={styles.subtitle}>Quên mật khẩu?</p>
            <h2 style={styles.title}>Đặt lại mật khẩu</h2>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleSendOTP} style={styles.form}>
            <div style={styles.description}>
              <span style={styles.descriptionIcon}>📧</span>
              <p style={styles.descriptionText}>
                Nhập email đăng ký của bạn, chúng tôi sẽ gửi mã OTP để xác thực và đặt lại mật khẩu
              </p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Email <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{...styles.submitBtn, ...(loading && styles.submitBtnDisabled)}}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Đang gửi mã OTP...
                </>
              ) : (
                <>
                  <span>📧</span>
                  Gửi mã OTP
                </>
              )}
            </button>

            <div style={styles.loginRedirect}>
              Nhớ mật khẩu? 
              <span 
                onClick={() => navigate("/login")}
                style={styles.loginLink}
              >
                Đăng nhập ngay
              </span>
            </div>
          </form>

          <div style={styles.footer}>
            <span style={styles.footerLink}>Chính sách bảo mật</span>
            <span style={styles.footerDot}>•</span>
            <span style={styles.footerLink}>Điều khoản sử dụng</span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div style={styles.decoration1}></div>
      <div style={styles.decoration2}></div>
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
    overflow: "hidden",
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
    maxWidth: "500px",
    margin: "0 auto",
  },
  
  card: {
    backgroundColor: "white",
    borderRadius: "32px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
    overflow: "hidden",
    padding: "45px 50px",
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
    marginBottom: "20px",
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
  
  subtitle: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "8px",
  },
  
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1a1a2e",
    margin: 0,
  },
  
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  
  description: {
    backgroundColor: "#f8f9fa",
    padding: "16px 20px",
    borderRadius: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    borderLeft: "4px solid #667eea",
  },
  
  descriptionIcon: {
    fontSize: "20px",
    flexShrink: 0,
  },
  
  descriptionText: {
    fontSize: "13px",
    color: "#555",
    lineHeight: "1.5",
    margin: 0,
    flex: 1,
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
    padding: "14px 18px 14px 42px",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "8px",
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
  
  loginRedirect: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    paddingTop: "8px",
  },
  
  loginLink: {
    color: "#667eea",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "5px",
    transition: "color 0.2s",
    ":hover": {
      color: "#764ba2",
    },
  },
  
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "32px",
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
  
  decoration1: {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  
  decoration2: {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(118,75,162,0.1) 0%, transparent 70%)",
    zIndex: 1,
    pointerEvents: "none",
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
    transform: translateY(-2px);
  }
  
  @media (max-width: 640px) {
    .card {
      padding: 30px 25px !important;
    }
    
    .logo-text {
      font-size: 18px !important;
    }
    
    .title {
      font-size: 24px !important;
    }
    
    .description {
      padding: 12px 16px !important;
    }
    
    .description-text {
      font-size: 12px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ForgotPassword;