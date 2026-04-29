import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { useBranding } from "../../context/BrandingContext";
import "./AdminLayout.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      icon: Store,
      label: "Sellers",
      path: "/admin/sellers",
    },
    {
      icon: Crown,
      label: "Paid Sellers",
      path: "/admin/paid-sellers",
    },
    {
      icon: Users,
      label: "Users",
      path: "/admin/users",
    },
    {
      icon: ShoppingCart,
      label: "Orders",
      path: "/admin/orders",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      path: "/admin/analytics",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && <button className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu" />}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {/* LOGO */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <LayoutDashboard size={32} />
          </div>
          {sidebarOpen && <h1>{branding.marketplaceName} Admin</h1>}
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`menu-item ${window.location.pathname === item.path ? "active" : ""}`}
              onClick={() => handleNavigate(item.path)}
              title={item.label}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {/* TOPBAR */}
        <header className="admin-topbar">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2>Welcome to Admin Panel</h2>
          <div className="admin-profile">
            <div className="profile-info">
              <span className="admin-name">Admin</span>
              <span className="admin-role">Owner</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
