import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { BACKEND_URL } from '../../../config'

const DEFAULT_AVATAR = "https://cdn2.fptshop.com.vn/small/avatar_trang_1_cd729c335b.jpg";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Avatar states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
  const [avatarUploadMethod, setAvatarUploadMethod] = useState('default');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    gender: "Other",
    dob: "",
    avatar_url: DEFAULT_AVATAR,
    street: "",
    ward: "",
    district: "",
    city: "",
    country: "Việt Nam"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadImageToR2 = async (file) => {
    if (!file) return DEFAULT_AVATAR;
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    try {
      const response = await api.post('/api/v1/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
     
      if (response.data.success) {
        return response.data.image_url;
      }
      return DEFAULT_AVATAR;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return DEFAULT_AVATAR;
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    setAvatarUploadMethod('file');
    setShowUrlInput(false);
  };

  const handleAvatarUrlChange = (e) => {
    const url = e.target.value;
    setAvatarPreview(url);
    setAvatarFile(null);
    setFormData(prev => ({ ...prev, avatar_url: url }));
    setAvatarUploadMethod('url');
  };

  const handleUseDefaultAvatar = () => {
    setAvatarPreview(DEFAULT_AVATAR);
    setAvatarFile(null);
    setFormData(prev => ({ ...prev, avatar_url: DEFAULT_AVATAR }));
    setAvatarUploadMethod('default');
    setShowUrlInput(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password.length < 6) return setError("Mật khẩu ít nhất 6 ký tự");
    if (formData.password !== formData.confirmPassword) return setError("Mật khẩu không khớp");
    if (!formData.street.trim()) return setError("Vui lòng nhập số nhà và tên đường");
    if (!formData.ward.trim()) return setError("Vui lòng nhập phường/xã");
    if (!formData.district.trim()) return setError("Vui lòng nhập quận/huyện");
    if (!formData.city.trim()) return setError("Vui lòng nhập tỉnh/thành phố");
   
    setLoading(true);
    setUploadingAvatar(true);
   
    try {
      let finalAvatarUrl = DEFAULT_AVATAR;
     
      if (avatarUploadMethod === 'file' && avatarFile) {
        finalAvatarUrl = await uploadImageToR2(avatarFile);
      } else if (avatarUploadMethod === 'url' && formData.avatar_url) {
        finalAvatarUrl = formData.avatar_url;
      } else {
        finalAvatarUrl = DEFAULT_AVATAR;
      }
     
      const fullAddress = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.city}, ${formData.country}`;
      const { confirmPassword, street, ward, district, city, country, ...payload } = formData;
      payload.address = fullAddress;
      payload.avatar_url = finalAvatarUrl;
      const response = await fetch(`${BACKEND_URL}/api/v1/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Đăng kí thất bại");
      alert("Đăng kí thành công!");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Image */}
      <div style={styles.backgroundImage}></div>
      <div style={styles.overlay}></div>
      
      {/* Floating Form Container */}
      <div style={styles.formContainer}>
        <div style={styles.card}>
          {/* Close Button */}
          <button style={styles.closeBtn} onClick={() => navigate("/")}>✕</button>
          
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logoIcon}>🌾</div>
            <h1 style={styles.logoText}>Đặc Sản Quê Tôi</h1>
            <p style={styles.welcomeText}>Chào mừng bạn đến với cộng đồng ẩm thực</p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRegister} style={styles.form}>
            {/* Avatar Section */}
            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={styles.avatar}
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <div style={styles.avatarEditBadge}>
                  <span>📷</span>
                </div>
              </div>
              
              <div style={styles.avatarButtons}>
                <button type="button" onClick={handleUseDefaultAvatar} style={styles.avatarBtn}>
                  Mặc định
                </button>
                <label style={styles.avatarBtn}>
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: "none" }} />
                  Tải ảnh
                </label>
                <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} style={styles.avatarBtn}>
                  URL
                </button>
              </div>
              
              {showUrlInput && (
                <input
                  type="text"
                  placeholder="Nhập URL ảnh đại diện"
                  onChange={handleAvatarUrlChange}
                  style={styles.urlInput}
                />
              )}
            </div>

            {/* Form Grid */}
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Tên đăng nhập <span style={styles.required}>*</span>
                </label>
                <input name="username" required style={styles.input} onChange={handleChange} placeholder="nguyenvana" />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Email <span style={styles.required}>*</span>
                </label>
                <input name="email" type="email" required style={styles.input} onChange={handleChange} placeholder="example@email.com" />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Họ và tên</label>
                <input name="full_name" style={styles.input} onChange={handleChange} placeholder="Nguyễn Văn A" />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Số điện thoại</label>
                <input name="phone" style={styles.input} onChange={handleChange} placeholder="0912345678" />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Giới tính</label>
                <select name="gender" style={styles.input} onChange={handleChange}>
                  <option value="Other">Khác</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                </select>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Ngày sinh</label>
                <input name="dob" type="date" style={styles.input} onChange={handleChange} />
              </div>
            </div>

            {/* Address Section */}
            <div style={styles.addressSection}>
              <h3 style={styles.sectionTitle}>Địa chỉ thường trú <span style={styles.required}>*</span></h3>
              
              <input name="street" placeholder="Số nhà, tên đường" required style={styles.fullWidthInput} onChange={handleChange} />
              
              <div style={styles.addressGrid}>
                <input name="ward" placeholder="Phường/Xã" required style={styles.input} onChange={handleChange} />
                <input name="district" placeholder="Quận/Huyện" required style={styles.input} onChange={handleChange} />
                <input name="city" placeholder="Tỉnh/Thành phố" required style={styles.input} onChange={handleChange} />
                <input name="country" value={formData.country} style={styles.input} onChange={handleChange} />
              </div>
            </div>

            {/* Password Section */}
            <div style={styles.passwordSection}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Mật khẩu <span style={styles.required}>*</span>
                </label>
                <div style={styles.passwordWrapper}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    style={styles.passwordInput}
                    onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Xác nhận mật khẩu <span style={styles.required}>*</span>
                </label>
                <div style={styles.passwordWrapper}>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    required
                    style={styles.passwordInput}
                    onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.passwordToggle}>
                    {showConfirmPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>
            </div>

            {error && <div style={styles.errorMessage}>{error}</div>}

            <button type="submit" disabled={loading || uploadingAvatar} style={styles.submitBtn}>
              {loading || uploadingAvatar ? (
                <>
                  <span style={styles.spinner}></span>
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký ngay"
              )}
            </button>

            <div style={styles.loginRedirect}>
              Đã có tài khoản?
              <span onClick={() => navigate("/login")} style={styles.loginLink}>
                Đăng nhập ngay
              </span>
            </div>
          </form>
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
    background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)",
    zIndex: 1,
  },
  
  formContainer: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
  },
  
  card: {
    backgroundColor: "white",
    borderRadius: "32px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
    overflow: "hidden",
    padding: "40px 50px",
    position: "relative",
    backdropFilter: "blur(0px)",
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
    backgroundColor: "#f0f0f0",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    color: "#666",
  },
  
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  
  logoIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  
  logoText: {
    fontSize: "24px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    marginBottom: "8px",
  },
  
  welcomeText: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  
  avatarWrapper: {
    position: "relative",
    width: "100px",
    height: "100px",
    cursor: "pointer",
  },
  
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #667eea",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
  },
  
  avatarEditBadge: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#667eea",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "2px solid white",
    fontSize: "14px",
  },
  
  avatarButtons: {
    display: "flex",
    gap: "8px",
  },
  
  avatarBtn: {
    padding: "6px 16px",
    fontSize: "12px",
    backgroundColor: "#f5f5f5",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#555",
    fontWeight: "500",
  },
  
  urlInput: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "13px",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    outline: "none",
  },
  
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },
  
  required: {
    color: "#e74c3c",
  },
  
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    fontFamily: "inherit",
  },
  
  fullWidthInput: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  },
  
  addressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "4px",
  },
  
  addressGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  
  passwordSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  
  passwordWrapper: {
    position: "relative",
  },
  
  passwordInput: {
    width: "100%",
    padding: "12px 45px 12px 14px",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
  },
  
  passwordToggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: 0,
  },
  
  errorMessage: {
    padding: "12px",
    backgroundColor: "#fee",
    color: "#e74c3c",
    borderRadius: "12px",
    fontSize: "13px",
    textAlign: "center",
  },
  
  submitBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "8px",
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
  },
  
  loginRedirect: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
  },
  
  loginLink: {
    color: "#667eea",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "5px",
    transition: "color 0.2s",
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
  
  input:focus, select:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .avatar-btn:hover {
    background: #e0e0e0;
  }
  
  .close-btn:hover {
    background: #e0e0e0;
    transform: rotate(90deg);
  }
  
  .login-link:hover {
    color: #764ba2;
  }
  
  @media (max-width: 768px) {
    .card {
      padding: 30px 25px !important;
    }
    
    .form-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    
    .address-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Register;