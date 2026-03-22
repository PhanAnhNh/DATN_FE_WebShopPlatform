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
import ShopLayout from "./components/Shoplayout/ShopLayout.jsx";
import ShopDashboard from "./pages/shop_manager/shop_dashboard.jsx";
import ShopLogin from "./pages/shop_manager/shop_login.jsx";
import ShopProfile from "./pages/shop_manager/shop_profile.jsx";
import ShopCustomers from "./pages/shop_manager/shop_manager.jsx";
import ShopProducts from "./pages/shop_manager/shop_product.jsx";
import ShopOrders from "./pages/shop_manager/shop_order.jsx";
import ShopRevenue from "./pages/shop_manager/shop_Statistics.jsx";
import ShopReturns from "./pages/shop_manager/ShopReturns.jsx"; 
import ShopSetting from "./pages/shop_manager/shop_setting.jsx"
import ShopVouchers from "./pages/shop_manager/ShopVouchers.jsx";
import ShopPage from "./pages/user/shop/Shop.jsx";
import { Layout } from "lucide-react";
import ShopDetailPage from "./pages/user/shop/shop_detail.jsx";
import ProductDetailPage from "./pages/user/shop/detail_products.jsx";
import CartPage from "./pages/user/cart.jsx";

function App() {
  return (
    // Bỏ thẻ <Router> đi, chỉ giữ lại <Routes>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/register" element={<Register />} /> 
      <Route path="/admin/login" element={<AdminLogin />} /> 
      <Route path="/use/shop" element={<ShopPage />} />
      <Route path="/shop/:shop_id" element={<ShopDetailPage />} />
      <Route path="/product/:product_id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
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
      <Route 
        path="/shop/dashboard" 
        element={
          <ShopLayout>
            <ShopDashboard />
          </ShopLayout>
        } 
      />
      <Route 
        path="/shop/login" 
        element={
            <ShopLogin/>
        } 
      />
      <Route 
        path="/shop/profile" 
        element={
          <ShopLayout>
            <ShopProfile />
          </ShopLayout>
        } 
      />
      <Route 
        path="/shop/customers" 
        element={
          <ShopLayout>
            <ShopCustomers />
          </ShopLayout>
        } 
      />
      <Route 
        path="/shop/products" 
        element={
          <ShopLayout>
            <ShopProducts />
          </ShopLayout>
        } 
      />
      <Route 
        path="/shop/orders" 
        element={
          <ShopLayout>
            <ShopOrders />
          </ShopLayout>
        } 
      />
      <Route 
        path="/shop/revenue" 
        element={
          <ShopLayout>
            <ShopRevenue />
          </ShopLayout>
        } 
      />

      <Route 
        path="/shop/returns" 
        element={
          <ShopLayout>
            <ShopReturns />
          </ShopLayout>
        } 
      />
      < Route
        path="/shop/settings"
        element={
          <ShopLayout>
            <ShopSetting/>
          </ShopLayout>
        }
        />
        < Route
        path="/shop/vouchers"
        element={
          <ShopLayout>
            <ShopVouchers/>
          </ShopLayout>
        }
        />
    </Routes>
  );
}

export default App;