import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./components/common/AppContext"; // Thêm import này
import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/account/signin.jsx";
import Profile from "./pages/user/profile.jsx";
import Register from "./pages/user/account/signup.jsx";
import AdminLogin from "./pages/admin/Admin_login.jsx";
import AdminLayout from "./components/Adminlayout/LayoutAdmin.jsx";
import DashboardPage from "./pages/admin/Dashboard.jsx";
import UsersManagement from "./pages/admin/ManageUsers.jsx";
import ShopsManagement from "./pages/admin/ManageShop.jsx";
import PostsManagement from "./pages/admin/ManagePosts.jsx";
import ShopLayout from "./components/Shoplayout/ShopLayout.jsx";
import ShopDashboard from "./pages/shop_manager/shop_dashboard.jsx";
import ShopLogin from "./pages/shop_manager/shop_login.jsx";
import ShopProfile from "./pages/shop_manager/shop_profile.jsx";
import ShopCustomers from "./pages/shop_manager/shop_manager.jsx";
import ShopProducts from "./pages/shop_manager/shop_product.jsx";
import ShopOrders from "./pages/shop_manager/shop_order.jsx";
import ShopRevenue from "./pages/shop_manager/shop_Statistics.jsx";
import ShopReturns from "./pages/shop_manager/ShopReturns.jsx"; 
import ShopSetting from "./pages/shop_manager/shop_setting.jsx";
import ShopVouchers from "./pages/shop_manager/ShopVouchers.jsx";
import ShopPage from "./pages/user/shop/Shop.jsx";
import ShopDetailPage from "./pages/user/shop/shop_detail.jsx";
import ProductDetailPage from "./pages/user/shop/detail_products.jsx";
import CartPage from "./pages/user/cart.jsx";
import CheckoutPage from "./pages/user/shop/CheckoutPage.jsx";
import PaymentInstructions from "./pages/user/shop/PaymentInstructions.jsx";
import OrderDetail from "./pages/user/shop/orderDetail.jsx";
import Orders from "./pages/user/orderHistory.jsx";
import UserProfile from "./pages/user/UserProfile.jsx";
import ProductReturns from "./pages/user/shop/product_return.jsx";
import ShippingUnitManager from "./pages/shop_manager/ShippingUnitManager.jsx";
import AdminProfile from "./pages/admin/Admin_profile.jsx";
import AdminSettings from "./pages/admin/Setting.jsx";
import ShippingVouchers from "./pages/shop_manager/ShippingVouchers.jsx";
import SavedPosts from "./pages/user/SavedPosts.jsx";
import PostDetailPage from "./pages/user/PostDetailPage.jsx";
import ReportsManagement from "./pages/admin/ReportsManagement.jsx";
import ForgotPassword from "./pages/user/account/forgot-password.jsx";
import VerifyOTP from "./pages/user/account/sent_otp.jsx";
import ResetPassword from "./pages/user/account/reset-password.jsx";

function App() {
  return (
    <AppProvider>
      
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/register" element={<Register />} /> 
            <Route path="/admin/login" element={<AdminLogin />} /> 
            <Route path="/use/shop" element={<ShopPage />} />
            <Route path="/shop/:shop_id" element={<ShopDetailPage />} />
            <Route path="/product/:product_id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment/instructions/:orderId" element={<PaymentInstructions />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/history/orders" element={<Orders />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/user/returns" element={<ProductReturns />} />
            <Route path="/user/saved-posts" element={<SavedPosts  />} />
            <Route path="/post/:postId" element={<PostDetailPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
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
              path="/admin/profile" 
              element={
                <AdminLayout>
                  <AdminProfile />
                </AdminLayout>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              } 
            />

            <Route 
              path="/admin/reports" 
              element={
                <AdminLayout>
                  <ReportsManagement />
                </AdminLayout>
              } 
            />
            {/* Shop Routes */}
            <Route 
              path="/shop/shipping-units" 
              element={
                <ShopLayout>
                  <ShippingUnitManager />
                </ShopLayout>
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
              element={<ShopLogin/>} 
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
            <Route 
              path="/shop/shipping-vouchers" 
              element={
                <ShopLayout>
                  <ShippingVouchers />
                </ShopLayout>
              } 
            />
            <Route
              path="/shop/settings"
              element={
                <ShopLayout>
                  <ShopSetting/>
                </ShopLayout>
              }
            />
            <Route
              path="/shop/vouchers"
              element={
                <ShopLayout>
                  <ShopVouchers/>
                </ShopLayout>
              }
            />
          </Routes>
        
    </AppProvider>
  );
}

export default App;