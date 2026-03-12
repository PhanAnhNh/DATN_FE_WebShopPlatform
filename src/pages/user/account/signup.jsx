import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validate cơ bản ở Front-end
    if (password.length < 6) {
      return setError("Mật khẩu phải có ít nhất 6 ký tự!");
    }
    if (password !== confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }

    try {
      // API /users/ yêu cầu body dạng JSON theo model UserCreate
      const payload = {
        username: username,
        email: email,
        password: password,
      };

      const response = await fetch("http://localhost:8000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Lấy câu thông báo lỗi từ backend (vd: "Username hoặc Email đã tồn tại")
        throw new Error(errorData.detail || "Đăng kí thất bại. Vui lòng thử lại!");
      }

      alert("Tạo tài khoản thành công! Vui lòng đăng nhập.");
      navigate("/login"); // Chuyển hướng người dùng về trang đăng nhập
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "15px 30px", background: "white", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #ddd" }}>
        <img src="https://placehold.co/40x40/2e7d32/white?text=Logo" alt="Logo" style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0, color: "#2e7d32", fontSize: "20px" }}>Đặc Sản Quê Tôi</h2>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "#f5eee1", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        
        <div style={{ display: "flex", width: "100%", maxWidth: "900px", height: "85%", minHeight: "550px", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          
          {/* Cột trái: Form đăng kí */}
          <div style={{ flex: 1, padding: "30px 50px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ textAlign: "center", marginBottom: "20px", fontSize: "24px" }}>Đăng kí tài khoản</h1>
            
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                placeholder="Tên đăng nhập (Username)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ padding: "12px 15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />

              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "12px 15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />
              
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ 
                    width: "100%", padding: "12px 15px", paddingRight: "45px", 
                    borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", 
                    outline: "none", boxSizing: "border-box" 
                  }}
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "18px", userSelect: "none" }}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>

              <input
                type="password"
                placeholder="Xác nhận lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ padding: "12px 15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />

              {error && <div style={{ color: "red", fontSize: "13px", textAlign: "center", marginTop: "5px" }}>{error}</div>}

              <button type="submit" style={{ padding: "15px", borderRadius: "8px", border: "none", backgroundColor: "#558b2f", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "10px" }}>
                Đăng kí
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "14px", color: "#333" }}>
              Đã có tài khoản? <span onClick={() => navigate("/login")} style={{ color: "#558b2f", fontWeight: "bold", cursor: "pointer" }}>Đăng nhập</span>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#db4437", fontWeight: "bold", fontSize: "18px" }}>G</span>
                <span style={{ fontSize: "14px" }}>Google</span>
              </button>
              <button style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#4267B2", fontWeight: "bold", fontSize: "18px" }}>f</span>
                <span style={{ fontSize: "14px" }}>FaceBook</span>
              </button>
            </div>
          </div>

          {/* Đường kẻ dọc phân cách */}
          <div style={{ width: "1px", height: "80%", backgroundColor: "#eee", margin: "0 10px" }}></div>

          {/* Cột phải: Hình ảnh */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%", paddingRight: "20px" }}>
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

export default Register;