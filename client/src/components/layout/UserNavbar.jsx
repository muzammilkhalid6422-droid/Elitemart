import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
  ChevronDown,
  Home,
  ShoppingCart,
  User,
  Package,
  Search,
  MoreVertical,
  X,
  ClipboardList,
  LogOut,
  Heart,
  Settings,
} from "lucide-react";
import { clearAuthSession } from "../../utils/authSession";
import { splitBrandName, useBranding } from "../../context/BrandingContext";
import "./UserNavbar.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { branding } = useBranding();
  const brandName = splitBrandName(branding.marketplaceName);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const user = (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })();

  const navLinks = [
    { name: "Home", path: "/home", icon: <Home /> },
    { name: "Shop", path: "/shop", icon: <Package /> },
    { name: "Cart", path: "/cart", icon: <ShoppingCart /> },
    { name: "Favourites", path: "/favorites", icon: <Heart /> },
    { name: "My Orders", path: "/my-orders", icon: <ClipboardList /> },
  ];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchText.trim();

    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    setSearchOpen(false);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    clearAuthSession("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="user-navbar-shell">

      <div className="user-navbar">

        {/* LOGO */}
        <Link to="/home" className="user-navbar-brand">
          {brandName.primary}<span>{brandName.accent || "."}</span>
        </Link>

        {/* DESKTOP SEARCH */}
        <form
          onSubmit={handleSearchSubmit}
          className="user-navbar-search"
        >
          <Search size={17} />
          <input
            type="text"
            placeholder="Search for products..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </form>

        {/* DESKTOP NAV */}
        <div className="user-navbar-links">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              to={link.path}
              className={`user-nav-item ${
                location.pathname === link.path ? "active-nav" : ""
              }` }
            >
              {link.icon}
              <span >{link.name}</span>
            </Link>
          ))}
          <div className="user-profile-menu-wrap">
            <button
              type="button"
              className={`user-profile-trigger ${profileOpen ? "active" : ""}`}
              onClick={() => setProfileOpen((value) => !value)}
            >
              <span className="user-profile-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || "User"} />
                ) : (
                  <User size={22} />
                )}
              </span>
              <span className="user-profile-name">{user?.name || "Profile"}</span>
              <ChevronDown size={18} />
            </button>

            {profileOpen && (
              <div className="user-profile-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                >
                  <Settings size={17} />
                  <span>Settings</span>
                </button>
                <button type="button" className="danger" onClick={handleLogout}>
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 📱 MOBILE ICONS */}
        <div className="user-navbar-mobile-actions">

          {/* 🔍 SEARCH ICON */}
          <button onClick={() => setSearchOpen(!searchOpen)}>
            {searchOpen ? <X /> : <Search />}
          </button>

          {/* ⋮ MENU ICON */}
          <button onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical />
          </button>

        </div>

        {/* 🔍 MOBILE SEARCH BOX */}
        {searchOpen && (
          <form className="mobile-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full bg-transparent outline-none text-white"
            />
          </form>
        )}

        {/* 📱 MOBILE MENU */}
        {menuOpen && (
          <div className="mobile-menu">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
              onClick={() => setMenuOpen(false)}
                className="mobile-item"
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="mobile-item"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="mobile-item text-red-400 hover:text-red-300"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

export default Navbar;
