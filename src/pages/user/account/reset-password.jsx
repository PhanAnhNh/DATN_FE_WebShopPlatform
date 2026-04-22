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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
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

  // Tính độ mạnh của mật khẩu
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 6) strength++;
    if (newPassword.length >= 10) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
    setPasswordStrength(Math.min(strength, 4));
  }, [newPassword]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const getStrengthText = () => {
    switch(passwordStrength) {
      case 0: return "Rất yếu";
      case 1: return "Yếu";
      case 2: return "Trung bình";
      case 3: return "Mạnh";
      case 4: return "Rất mạnh";
      default: return "";
    }
  };

  const getStrengthColor = () => {
    switch(passwordStrength) {
      case 0: return "#ff4444";
      case 1: return "#ff8844";
      case 2: return "#ffcc44";
      case 3: return "#88cc44";
      case 4: return "#44cc44";
      default: return "#e0e0e0";
    }
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
          <button style={styles.closeBtn} onClick={() => navigate("/verify-otp")}>✕</button>
          
          {/* Logo & Header */}
          <div style={styles.header}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoIcon}>🔒</div>
              <h1 style={styles.logoText}>Đặc Sản Quê Tôi</h1>
            </div>
            <p style={styles.subtitle}>Bảo mật tài khoản</p>
            <h2 style={styles.title}>Đặt lại mật khẩu</h2>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.emailInfo}>
              <span style={styles.emailIcon}>📧</span>
              <div style={styles.emailContent}>
                <p style={styles.emailLabel}>Đang đặt lại mật khẩu cho tài khoản</p>
                <p style={styles.emailValue}>{email}</p>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mật khẩu mới <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔐</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div style={styles.strengthContainer}>
                  <div style={styles.strengthBar}>
                    <div style={{
                      ...styles.strengthFill,
                      width: `${(passwordStrength / 4) * 100}%`,
                      backgroundColor: getStrengthColor()
                    }}></div>
                  </div>
                  <span style={{...styles.strengthText, color: getStrengthColor()}}>
                    Độ mạnh: {getStrengthText()}
                  </span>
                </div>
              )}
              
              <div style={styles.passwordRules}>
                <p style={styles.rulesTitle}>Mật khẩu nên bao gồm:</p>
                <ul style={styles.rulesList}>
                  <li style={{...styles.ruleItem, color: newPassword.length >= 6 ? "#44cc44" : "#999"}}>
                    ✓ Ít nhất 6 ký tự
                  </li>
                  <li style={{...styles.ruleItem, color: /[A-Z]/.test(newPassword) ? "#44cc44" : "#999"}}>
                    ✓ Chữ hoa (A-Z)
                  </li>
                  <li style={{...styles.ruleItem, color: /[0-9]/.test(newPassword) ? "#44cc44" : "#999"}}>
                    ✓ Số (0-9)
                  </li>
                  <li style={{...styles.ruleItem, color: /[^A-Za-z0-9]/.test(newPassword) ? "#44cc44" : "#999"}}>
                    ✓ Ký tự đặc biệt (!@#$%...)
                  </li>
                </ul>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Xác nhận mật khẩu <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✓</span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={styles.input}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? "👁️" : "🙈"}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={styles.errorHint}>Mật khẩu xác nhận không khớp</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword && (
                <p style={styles.successHint}>✓ Mật khẩu khớp</p>
              )}
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                style={{...styles.submitBtn, ...((loading || !newPassword || !confirmPassword || newPassword !== confirmPassword) && styles.buttonDisabled)}}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    Đặt lại mật khẩu
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/verify-otp")}
                style={styles.backBtn}
              >
                ← Quay lại
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
    maxWidth: "560px",
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
  
  emailInfo: {
    backgroundColor: "#f8f9fa",
    padding: "16px 20px",
    borderRadius: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    border: "1px solid #e0e0e0",
  },
  
  emailIcon: {
    fontSize: "24px",
  },
  
  emailContent: {
    flex: 1,
  },
  
  emailLabel: {
    fontSize: "12px",
    color: "#888",
    margin: 0,
    marginBottom: "4px",
  },
  
  emailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    margin: 0,
    wordBreak: "break-all",
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
    padding: "14px 45px 14px 42px",
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
  
  strengthContainer: {
    marginTop: "8px",
  },
  
  strengthBar: {
    height: "4px",
    backgroundColor: "#e0e0e0",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "6px",
  },
  
  strengthFill: {
    height: "100%",
    transition: "width 0.3s ease, background-color 0.3s ease",
  },
  
  strengthText: {
    fontSize: "11px",
    fontWeight: "500",
  },
  
  passwordRules: {
    backgroundColor: "#f8f9fa",
    padding: "12px 16px",
    borderRadius: "12px",
    marginTop: "4px",
  },
  
  rulesTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#666",
    margin: 0,
    marginBottom: "8px",
  },
  
  rulesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },
  
  ruleItem: {
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  
  errorHint: {
    fontSize: "11px",
    color: "#e74c3c",
    margin: 0,
  },
  
  successHint: {
    fontSize: "11px",
    color: "#44cc44",
    margin: 0,
  },
  
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
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
  },
  
  backBtn: {
    padding: "12px",
    background: "white",
    color: "#666",
    border: "1px solid #e0e0e0",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  
  buttonDisabled: {
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
  
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  .back-btn:hover {
    background: #f5f5f5;
  }
  
  .close-btn:hover {
    background: #e0e0e0;
    transform: rotate(90deg);
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
    
    .rules-list {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ResetPassword;