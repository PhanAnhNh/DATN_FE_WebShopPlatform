import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email); 
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Email hoặc mật khẩu không chính xác!");
      }

      const data = await response.json();

      localStorage.setItem("access_token", data.access_token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user)); 
      }

      alert("Đăng nhập thành công!");
       navigate("/"); 
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
        
        <div style={{ display: "flex", width: "100%", maxWidth: "900px", height: "80%", minHeight: "500px", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Cột trái: Form đăng nhập */}
          <div style={{ flex: 1, padding: "20px 50px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>Đăng nhập</h1>
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input
                type="text"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "15px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "#e9ecef", outline: "none" }}
              />
              
              <div>
                {/* 2. BỌC INPUT MẬT KHẨU VÀO MỘT DIV RELATIVE */}
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    // 3. ĐỔI TYPE DỰA TRÊN STATE
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "15px", 
                      paddingRight: "45px", // Chừa chỗ trống bên phải để chữ không đè lên icon
                      borderRadius: "8px", 
                      border: "1px solid #ccc", 
                      backgroundColor: "#e9ecef", 
                      outline: "none", 
                      boxSizing: "border-box" 
                    }}
                  />
                  {/* 4. NÚT MẮT ĐỂ TOGGLE */}
                  <span 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: "absolute", 
                      right: "15px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      cursor: "pointer",
                      fontSize: "18px",
                      userSelect: "none" // Ngăn bôi đen nhầm khi click nhanh
                    }}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </span>
                </div>

                <div style={{ textAlign: "right", marginTop: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#555", cursor: "pointer" }}>Quên mật khẩu</span>
                </div>
              </div>

              {error && <div style={{ color: "red", fontSize: "13px", textAlign: "center" }}>{error}</div>}

              <button type="submit" style={{ padding: "15px", borderRadius: "8px", border: "none", backgroundColor: "#558b2f", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "10px" }}>
                Đăng nhập
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#333" }}>
              Chưa có tài khoản? <span style={{ color: "#558b2f", fontWeight: "bold", cursor: "pointer" }}>Đăng kí</span>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ color: "#db4437", fontWeight: "bold", fontSize: "18px" }}>G</span>
                <span>.</span>
                <span>Google</span>
              </button>
              <button style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", background: "white", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ color: "#4267B2", fontWeight: "bold", fontSize: "18px" }}>f</span>
                <span>.</span>
                <span>FaceBook</span>
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "auto", fontSize: "12px", color: "#777" }}>
              Chính sách | Điều khoản
            </div>
          </div>

          {/* Đường kẻ dọc phân cách */}
          <div style={{ width: "1px", height: "80%", backgroundColor: "#ccc", margin: "0 20px" }}></div>

          {/* Cột phải: Hình ảnh */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
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

export default Login;