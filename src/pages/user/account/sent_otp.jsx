// src/pages/user/account/verify-otp.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Toast from '../../../components/common/Toast';
import { BACKEND_URL } from '../../../config'
import { userApi } from '../../api/api';

function VerifyOTP() {
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("reset_email");
    if (!savedEmail) {
      navigate("/forgot-password");
      return;
    }
    setEmail(savedEmail);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleOtpChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(0, 1);
    setOtpCode(newOtp);

    // Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Xử lý phím backspace
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0) {
        const newOtp = [...otpCode];
        newOtp[index - 1] = "";
        setOtpCode(newOtp);
        inputRefs.current[index - 1].focus();
      } else if (otpCode[index]) {
        const newOtp = [...otpCode];
        newOtp[index] = "";
        setOtpCode(newOtp);
      }
    }
    
    // Xử lý phím mũi tên
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const pastedArray = pastedData.split('');
      const newOtp = [...otpCode];
      for (let i = 0; i < Math.min(pastedArray.length, 6); i++) {
        newOtp[i] = pastedArray[i];
      }
      setOtpCode(newOtp);
      // Focus vào ô cuối cùng đã điền
      const lastFilledIndex = Math.min(pastedArray.length, 6) - 1;
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const getFullOtp = () => {
    return otpCode.join('');
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const fullOtp = getFullOtp();
    
    if (fullOtp.length !== 6) {
      showToast("Vui lòng nhập đủ 6 số OTP", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/password/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp_code: fullOtp,
          otp_type: "forgot_password"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Mã OTP không hợp lệ");
      }

      showToast("Xác thực OTP thành công!", "success");
      localStorage.setItem("verified_otp", fullOtp);
      
      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      // ✅ Dùng API instance thay vì fetch
      const response = await userApi.post("/password/forgot-password", {
        email: email
      });

      // response.data đã được axios parse sẵn
      showToast("Đã gửi lại mã OTP mới!", "success");
      
      setTimeLeft(300);
      setCanResend(false);
      setOtpCode(["", "", "", "", "", ""]);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      inputRefs.current[0]?.focus();
      
    } catch (err) {
      // Axios error handling
      const message = err.response?.data?.detail || err.message || "Có lỗi xảy ra";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
};

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
          <button style={styles.closeBtn} onClick={() => navigate("/forgot-password")}>✕</button>
          
          <div style={styles.header}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoIcon}>✉️</div>
              <h1 style={styles.logoText}>Đặc Sản Quê Tôi</h1>
            </div>
            <p style={styles.subtitle}>Xác thực tài khoản</p>
            <h2 style={styles.title}>Nhập mã OTP</h2>
          </div>

          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <div style={styles.emailInfo}>
              <span style={styles.emailIcon}>📧</span>
              <div style={styles.emailContent}>
                <p style={styles.emailLabel}>Mã OTP đã được gửi đến email</p>
                <p style={styles.emailValue}>{email}</p>
              </div>
            </div>

            <div style={styles.timerBox}>
              <span style={styles.timerIcon}>⏱️</span>
              <span style={styles.timerText}>
                Mã OTP sẽ hết hạn sau: <strong style={styles.timerCount}>{formatTime(timeLeft)}</strong>
              </span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mã OTP <span style={styles.required}>*</span>
              </label>
              <div style={styles.otpContainer} onPaste={handlePaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    style={styles.otpInput}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p style={styles.otpHint}>Nhập mã 6 số từ email của bạn</p>
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                disabled={loading || getFullOtp().length !== 6}
                style={{...styles.verifyBtn, ...((loading || getFullOtp().length !== 6) && styles.buttonDisabled)}}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Xác thực OTP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || loading}
                style={{...styles.resendBtn, ...((!canResend || loading) && styles.buttonDisabled)}}
              >
                {!canResend ? (
                  <>
                    <span>⏰</span>
                    Gửi lại sau {formatTime(timeLeft)}
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    Gửi lại mã OTP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
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
  
  timerBox: {
    backgroundColor: "#fff3e0",
    padding: "12px 16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #ffe0b2",
  },
  
  timerIcon: {
    fontSize: "18px",
  },
  
  timerText: {
    fontSize: "13px",
    color: "#e65100",
  },
  
  timerCount: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#e65100",
  },
  
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  
  required: {
    color: "#e74c3c",
  },
  
  otpContainer: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  
  otpInput: {
    width: "60px",
    height: "60px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    backgroundColor: "#fafafa",
    transition: "all 0.2s ease",
    outline: "none",
    fontFamily: "monospace",
    color: "#333",
  },
  
  otpHint: {
    fontSize: "11px",
    color: "#999",
    textAlign: "center",
    margin: 0,
  },
  
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },
  
  verifyBtn: {
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
  
  resendBtn: {
    padding: "12px",
    background: "white",
    color: "#667eea",
    border: "1.5px solid #667eea",
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
  
  .verify-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  .resend-btn:hover {
    background: #f0f0ff;
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
    
    .otp-input {
      width: 45px !important;
      height: 45px !important;
      font-size: 20px !important;
    }
    
    .otp-container {
      gap: 8px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default VerifyOTP;