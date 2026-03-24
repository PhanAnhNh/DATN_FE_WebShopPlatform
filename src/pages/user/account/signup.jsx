import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Quản lý state tập trung cho toàn bộ form
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    gender: "Other",
    dob: "",
    // Địa chỉ chi tiết
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password.length < 6) return setError("Mật khẩu ít nhất 6 ký tự");
    if (formData.password !== formData.confirmPassword) return setError("Mật khẩu không khớp");
    
    // Validation địa chỉ
    if (!formData.street.trim()) return setError("Vui lòng nhập số nhà và tên đường");
    if (!formData.ward.trim()) return setError("Vui lòng nhập phường/xã");
    if (!formData.district.trim()) return setError("Vui lòng nhập quận/huyện");
    if (!formData.city.trim()) return setError("Vui lòng nhập tỉnh/thành phố");
    
    setLoading(true);
    try {
      // Ghép địa chỉ thành một chuỗi để gửi lên backend
      const fullAddress = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.city}, ${formData.country}`;
      
      // Loại bỏ confirmPassword và các trường địa chỉ riêng lẻ
      const { confirmPassword, street, ward, district, city, country, ...payload } = formData;
      
      // Thêm address đã ghép vào payload
      payload.address = fullAddress;

      const response = await fetch("http://localhost:8000/api/v1/users/", {
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
    }
  };

  // Style dùng chung cho input
  const inputStyle = {
    padding: "10px 15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#e9ecef",
    outline: "none",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box"
  };

  const labelStyle = {
    fontSize: "12px",
    color: "#666",
    marginBottom: "4px",
    display: "block"
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", backgroundColor: "#f5eee1" }}>
      {/* Header */}
      <div style={{ padding: "10px 30px", background: "white", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #ddd" }}>
        <img src="https://placehold.co/40x40/2e7d32/white?text=Logo" alt="Logo" style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0, color: "#2e7d32", fontSize: "18px" }}>Đặc Sản Quê Tôi</h2>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ display: "flex", width: "100%", maxWidth: "1100px", backgroundColor: "white", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          
          {/* Cột trái: Form */}
          <div style={{ flex: 1.5, padding: "40px", overflowY: "auto", maxHeight: "80vh" }}>
            <h1 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#333" }}>Tạo tài khoản mới</h1>
            
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              {/* Hàng 1: Username & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Tên đăng nhập *</label>
                  <input name="username" required style={inputStyle} onChange={handleChange} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input name="email" type="email" required style={inputStyle} onChange={handleChange} />
                </div>
              </div>

              {/* Hàng 2: Họ tên & Số điện thoại */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Họ và tên</label>
                  <input name="full_name" style={inputStyle} onChange={handleChange} />
                </div>
                <div>
                  <label style={labelStyle}>Số điện thoại</label>
                  <input name="phone" placeholder="VD: 0912345678" style={inputStyle} onChange={handleChange} />
                </div>
              </div>

              {/* Hàng 3: Giới tính & Ngày sinh */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Giới tính</label>
                  <select name="gender" style={inputStyle} onChange={handleChange}>
                    <option value="Other">Khác</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ngày sinh</label>
                  <input name="dob" type="date" style={inputStyle} onChange={handleChange} />
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div style={{ marginTop: "8px" }}>
                <label style={{ ...labelStyle, fontWeight: "bold", color: "#333" }}>Địa chỉ thường trú *</label>
              </div>
              
              {/* Số nhà, tên đường */}
              <div>
                <label style={labelStyle}>Số nhà, tên đường *</label>
                <input 
                  name="street" 
                  placeholder="VD: 123 Nguyễn Văn A" 
                  required 
                  style={inputStyle} 
                  onChange={handleChange} 
                />
              </div>

              {/* Phường/Xã */}
              <div>
                <label style={labelStyle}>Phường/Xã *</label>
                <input 
                  name="ward" 
                  placeholder="VD: Phường Hòa Hải" 
                  required 
                  style={inputStyle} 
                  onChange={handleChange} 
                />
              </div>

              {/* Quận/Huyện */}
              <div>
                <label style={labelStyle}>Quận/Huyện *</label>
                <input 
                  name="district" 
                  placeholder="VD: Quận Ngũ Hành Sơn" 
                  required 
                  style={inputStyle} 
                  onChange={handleChange} 
                />
              </div>

              {/* Tỉnh/Thành phố */}
              <div>
                <label style={labelStyle}>Tỉnh/Thành phố *</label>
                <input 
                  name="city" 
                  placeholder="VD: Đà Nẵng" 
                  required 
                  style={inputStyle} 
                  onChange={handleChange} 
                />
              </div>

              {/* Quốc gia */}
              <div>
                <label style={labelStyle}>Quốc gia</label>
                <input 
                  name="country" 
                  value={formData.country}
                  style={inputStyle} 
                  onChange={handleChange} 
                />
              </div>

              {/* Mật khẩu */}
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>Mật khẩu *</label>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Ít nhất 6 ký tự" 
                  required 
                  style={inputStyle} 
                  onChange={handleChange} 
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "15px", top: "28px", cursor: "pointer" }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label style={labelStyle}>Xác nhận mật khẩu *</label>
                <input 
                  name="confirmPassword" 
                  type="password" 
                  placeholder="Nhập lại mật khẩu" 
                  required 
                  style={inputStyle} 
                  onChange={handleChange} 
                />
              </div>

              {error && <div style={{ color: "#d32f2f", fontSize: "13px", fontWeight: "bold", padding: "8px", backgroundColor: "#ffebee", borderRadius: "6px" }}>{error}</div>}

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: "12px", borderRadius: "8px", border: "none", 
                  backgroundColor: loading ? "#ccc" : "#558b2f", color: "white", 
                  fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "10px" 
                }}
              >
                {loading ? "Đang xử lý..." : "Đăng kí ngay"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
              Đã có thành viên? <span onClick={() => navigate("/login")} style={{ color: "#558b2f", fontWeight: "bold", cursor: "pointer" }}>Đăng nhập tại đây</span>
            </div>
          </div>

          {/* Cột phải: Ảnh minh họa */}
          <div style={{ flex: 1, backgroundColor: "#dcedc8", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <img 
                src="https://placehold.co/300x400/558b2f/white?text=Dac+San+Que" 
                alt="Feature" 
                style={{ width: "100%", maxWidth: "280px", borderRadius: "10px", boxShadow: "0 5px 15px rgba(0,0,0,0.2)" }}
              />
              <p style={{ marginTop: "15px", color: "#336600", fontWeight: "500" }}>Khám phá tinh hoa ẩm thực vùng miền</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;