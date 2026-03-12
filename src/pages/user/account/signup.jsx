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
    gender: "Other", // Mặc định
    dob: "",
    address: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // 2. Validation nâng cao
    if (formData.password.length < 6) return setError("Mật khẩu ít nhất 6 ký tự");
    if (formData.password !== formData.confirmPassword) return setError("Mật khẩu không khớp");
    
    setLoading(true);
    try {
      // Loại bỏ confirmPassword trước khi gửi lên Backend
      const { confirmPassword, ...payload } = formData;

      const response = await fetch("http://localhost:8000/users/", {
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
    fontSize: "14px"
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", backgroundColor: "#f5eee1" }}>
      {/* Header */}
      <div style={{ padding: "10px 30px", background: "white", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #ddd" }}>
        <img src="https://placehold.co/40x40/2e7d32/white?text=Logo" alt="Logo" style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0, color: "#2e7d32", fontSize: "18px" }}>Đặc Sản Quê Tôi</h2>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ display: "flex", width: "100%", maxWidth: "1000px", backgroundColor: "white", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          
          {/* Cột trái: Form (Chiếm 60% chiều rộng để đủ chỗ cho nhiều input) */}
          <div style={{ flex: 1.5, padding: "40px" }}>
            <h1 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#333" }}>Tạo tài khoản mới</h1>
            
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              {/* Hàng 1: Username & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input name="username" placeholder="Tên đăng nhập *" required style={inputStyle} onChange={handleChange} />
                <input name="email" type="email" placeholder="Email *" required style={inputStyle} onChange={handleChange} />
              </div>

              {/* Hàng 2: Họ tên & Số điện thoại */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input name="full_name" placeholder="Họ và tên" style={inputStyle} onChange={handleChange} />
                <input name="phone" placeholder="Số điện thoại" style={inputStyle} onChange={handleChange} />
              </div>

              {/* Hàng 3: Giới tính & Ngày sinh */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <select name="gender" style={inputStyle} onChange={handleChange}>
                  <option value="Other">Giới tính: Khác</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                </select>
                <input name="dob" type="date" style={inputStyle} onChange={handleChange} title="Ngày sinh" />
              </div>

              {/* Địa chỉ */}
              <input name="address" placeholder="Địa chỉ thường trú" style={inputStyle} onChange={handleChange} />

              {/* Mật khẩu */}
              <div style={{ position: "relative" }}>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mật khẩu *" 
                  required 
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} 
                  onChange={handleChange} 
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>

              <input 
                name="confirmPassword" 
                type="password" 
                placeholder="Xác nhận mật khẩu *" 
                required 
                style={inputStyle} 
                onChange={handleChange} 
              />

              {error && <div style={{ color: "#d32f2f", fontSize: "13px", fontWeight: "bold" }}>{error}</div>}

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: "12px", borderRadius: "8px", border: "none", 
                  backgroundColor: loading ? "#ccc" : "#558b2f", color: "white", 
                  fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "5px" 
                }}
              >
                {loading ? "Đang xử lý..." : "Đăng kí ngay"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "14px" }}>
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