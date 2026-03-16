// File: App.jsx
import { Routes, Route } from "react-router-dom"; // Không import BrowserRouter ở đây nữa
import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/account/signin.jsx"; // Hãy đảm bảo đường dẫn này đúng nhé
import Profile from "./pages/user/profile.jsx";
import Register from "./pages/user/account/signup.jsx"; // Đảm bảo đường dẫn này đúng nhé
import AdminLogin from "./pages/admin/Admin_login.jsx";
import AdminLayout from "./components/Adminlayout/LayoutAdmin.jsx";
import DashboardPage from "./pages/admin/Dashboard.jsx";
import UsersManagement from "./pages/admin/ManageUsers.jsx";
import ShopsManagement from "./pages/admin/ManageShop.jsx";
import PostsManagement from "./pages/admin/ManagePosts.jsx";
import Statistics from "./pages/admin/Statistical.jsx";

function App() {
  return (
    // Bỏ thẻ <Router> đi, chỉ giữ lại <Routes>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/register" element={<Register />} /> 
      <Route path="/admin/login" element={<AdminLogin />} /> 
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <AdminLayout>
            <UsersManagement />
          </AdminLayout>
        } 
      />
      <Route 
        path="/admin/stores" 
        element={
          <AdminLayout>
            <ShopsManagement />
          </AdminLayout>
        } 
      />
      <Route 
        path="/admin/posts" 
        element={
          <AdminLayout>
            <PostsManagement />
          </AdminLayout>
        } 
      />
      <Route 
        path="/admin/statistics" 
        element={
          <AdminLayout>
            <Statistics />
          </AdminLayout>
        } 
      />
    </Routes>
    
  );
}

export default App;