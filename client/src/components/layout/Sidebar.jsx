import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  UserCircle,
  LogOut,
  ShoppingBag,
  ChevronRight,
  Crown,
} from "lucide-react";
import { getPlanStatus, hasPremiumPlan } from "../../services/planService";
import { clearAuthSession } from "../../utils/authSession";
import { useBranding } from "../../context/BrandingContext";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/seller/dashboard" },
  { name: "Products", icon: Package, path: "/seller/products" },
  { name: "Orders", icon: ShoppingCart, path: "/seller/orders" },
  { name: "Customers", icon: Users, path: "/seller/customers" },
  { name: "AI Insights", icon: Crown, path: "/seller/ai-insights", premium: true },
  { name: "Analytics", icon: BarChart3, path: "/seller/analytics", premium: true },
  { name: "Market Trends", icon: Megaphone, path: "/seller/market-trends", premium: true },
  { name: "Settings", icon: Settings, path: "/seller/settings" },
];

const Sidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [seller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const sellerHasPremium = hasPremiumPlan(seller);
  const sellerPlanStatus = getPlanStatus(seller);

  const handleLogout = () => {
    clearAuthSession("seller");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="seller-sidebar">
      {/* TOP */}
      <div>
        {/* LOGO */}
        <div className="seller-brand">
          <div className="seller-brand-mark">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="seller-brand-title">{branding.marketplaceName}</h1>
            <p className="seller-brand-subtitle">Seller workspace</p>
          </div>
        </div>

        {/* USER PROFILE */}
        {seller && (
          <div className="seller-user-card">
            <div className="seller-user-avatar">
              {seller.name?.charAt(0).toUpperCase()}
            </div>
            <div className="seller-user-info">
              <div className="seller-user-name">{seller.name || "Seller"}</div>
              <div className="seller-user-email">{seller.email || "seller@email.com"}</div>
            </div>
            <div className={`seller-user-badge ${sellerHasPremium ? "premium" : "free"}`}>
              {sellerHasPremium ? "PRO" : "FREE"}
            </div>
          </div>
        )}

        {/* MENU */}
        <nav className="seller-nav-menu">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `seller-nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {item.premium && !sellerHasPremium && (
                  <small className="seller-lock-badge">Premium</small>
                )}
                <ChevronRight size={16} className="seller-nav-arrow" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM */}
      <div className="seller-sidebar-bottom">
        {/* PREMIUM SECTION */}
        <div className="seller-premium-section">
          <div className="seller-premium-icon">
            <Crown size={32} />
          </div>
          <div className="seller-premium-text">
            <h3>{sellerHasPremium ? "Premium Active" : "Upgrade to Premium"}</h3>
            <p>
              {sellerHasPremium
                ? sellerPlanStatus
                : "Unlock AI insights, analytics, and market trends."}
            </p>
          </div>
          <button
            type="button"
            className="seller-premium-btn"
            onClick={() => navigate("/seller/settings")}
          >
            <span>{sellerHasPremium ? "•" : "+"}</span>
            {sellerHasPremium ? "View Plan" : "Upgrade Now"}
          </button>
        </div>

        {/* PROFILE & LOGOUT */}
        <button
          onClick={() => navigate("/seller/settings")}
          className="seller-sidebar-item"
        >
          <UserCircle size={18} />
          <span>Profile</span>
          <ChevronRight size={16} />
        </button>

        <button
          onClick={handleLogout}
          className="seller-sidebar-item logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
