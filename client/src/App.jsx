import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Layouts
import UserLayout from "./components/layout/UserLayout";
import SellerLayout from "./components/layout/SellerLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";

// User Pages
import Home from "./pages/user/Home";
import Shop from "./pages/user/Shop";
import ProductDetails from "./pages/user/ProductDetails";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import MyOrders from "./pages/user/MyOrders";
import Profile from "./pages/user/Profile";
import Blogs from "./pages/user/Blogs";
import Footer from "./pages/user/Footer";
import Favorites from "./pages/user/Favorites";

// Seller Pages
import Dashboard from "./pages/seller/Dashboard";
import Products from "./pages/seller/Products";
import Orders from "./pages/seller/Orders";
import Customers from "./pages/seller/Customers";
import Analytics from "./pages/seller/Analytics";
import AIInsights from "./pages/seller/AIInsights";
import Marketing from "./pages/seller/Marketing";
import Settings from "./pages/seller/Settings";
import AddProduct from "./pages/seller/AddProduct";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import SellersList from "./pages/admin/SellersList";
import PaidSellers from "./pages/admin/PaidSellers";
import ProtectedPremiumRoute from "./components/ProtectedPremiumRoute";
import TrafficTracker from "./components/TrafficTracker";
import { BrandingProvider } from "./context/BrandingContext";
import { getActiveAuthUser, getRoleSession } from "./utils/authSession";

const getStoredSeller = () => {
  return getRoleSession("seller")?.user || null;
};

const getStoredAuthUser = () => {
  return getActiveAuthUser();
};

const AuthRedirect = () => {
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken) return <Navigate to="/admin/dashboard" replace />;

  const user = getStoredAuthUser();
  if (user?.role === "seller") return <Navigate to="/seller/dashboard" replace />;
  if (user?.role === "user") return <Navigate to="/home" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  const storedSeller = getStoredSeller();
  const location = useLocation();
  const authPages = new Set(["/login", "/register", "/admin/login"]);
  const showFooter = !location.pathname.startsWith("/admin") && !authPages.has(location.pathname);

  return (
    <BrandingProvider>
      <div className="min-h-screen flex flex-col">
        <TrafficTracker />

        {/* ROUTES */}
        <div className="flex-grow">
          <Routes>

          {/* 🔥 Default → Login */}
          <Route path="/" element={<AuthRedirect />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* USER ROUTES */}
          <Route path="/" element={<UserLayout />}>
            <Route path="home" element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="my-orders" element={<MyOrders />} />
            <Route path="profile" element={<Profile />} />
            <Route path="blogs" element={<Blogs />} />
          </Route>

          {/* SELLER ROUTES */}
          <Route path="/seller" element={<SellerLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<AddProduct />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route
              path="ai-insights"
              element={
                <ProtectedPremiumRoute seller={storedSeller}>
                  <AIInsights />
                </ProtectedPremiumRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedPremiumRoute seller={storedSeller}>
                  <Analytics />
                </ProtectedPremiumRoute>
              }
            />
            <Route
              path="market-trends"
              element={
                <ProtectedPremiumRoute seller={storedSeller}>
                  <Marketing />
                </ProtectedPremiumRoute>
              }
            />
            <Route
              path="marketing"
              element={
                <ProtectedPremiumRoute seller={storedSeller}>
                  <Marketing />
                </ProtectedPremiumRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="sellers" element={<SellersList />} />
            <Route path="paid-sellers" element={<PaidSellers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 → back to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </div>

        {/* FOOTER */}
        {showFooter && <Footer />}

      </div>
    </BrandingProvider>
  );
}

export default App;
