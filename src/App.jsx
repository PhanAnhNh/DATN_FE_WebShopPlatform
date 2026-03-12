// File: App.jsx
import { Routes, Route } from "react-router-dom"; // Không import BrowserRouter ở đây nữa
import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/account/signin.jsx"; // Hãy đảm bảo đường dẫn này đúng nhé
import Profile from "./pages/user/profile.jsx";
import Register from "./pages/user/account/signup.jsx"; // Đảm bảo đường dẫn này đúng nhé

function App() {
  return (
    // Bỏ thẻ <Router> đi, chỉ giữ lại <Routes>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/register" element={<Register />} /> 
    </Routes>
  );
}

export default App;