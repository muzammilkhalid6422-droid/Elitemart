import {
  Bell,
  Box,
  CheckCircle2,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSellerOrders } from "../../services/orderService";
import { getPlanStatus, hasPremiumPlan } from "../../services/planService";
import { clearAuthSession } from "../../utils/authSession";

const Topbar = ({ openSidebar }) => {
  const [seller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => new Date().getTime());
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const loadNotifications = async () => {
      try {
        const data = await getSellerOrders();
        if (!ignore) {
          setOrders(data || []);
        }
      } catch (error) {
        console.error("Seller notifications error:", error);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 15000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const notifications = useMemo(
    () =>
      orders
        .flatMap((order) =>
          (order.sellerSubOrders || []).map((subOrder) => ({
            id: `${order.id}-${subOrder.id}`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            customer: order.customer?.name || "Customer",
            amount: order.sellerTotal || subOrder.subtotal || 0,
            status: subOrder.status || "Pending",
            createdAt: order.createdAt,
            isNew: ["Pending", "Confirmed"].includes(subOrder.status || "Pending"),
          }))
        )
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [orders]
  );

  const unreadCount = notifications.filter((item) => item.isNew).length;
  const sellerPlanStatus = getPlanStatus(seller);
  const premiumActive = hasPremiumPlan(seller);

  const getNotificationMeta = (status) => {
    switch (status) {
      case "Pending":
        return {
          icon: ShoppingBag,
          tone: "purple",
          title: "New order received",
          message: "has been placed",
        };
      case "Confirmed":
        return {
          icon: TrendingUp,
          tone: "green",
          title: "Sales target achieved",
          message: "is ready for processing",
        };
      case "Shipped":
      case "Out for Delivery":
        return {
          icon: Box,
          tone: "blue",
          title: "Product update",
          message: `status changed to ${status}`,
        };
      case "Delivered":
      case "Completed":
        return {
          icon: CheckCircle2,
          tone: "amber",
          title: "Order delivered",
          message: `status changed to ${status}`,
        };
      default:
        return {
          icon: Bell,
          tone: "blue",
          title: "Order notification",
          message: `status: ${status}`,
        };
    }
  };

  const formatTimeAgo = (value) => {
    if (!value) return "Just now";
    const diffMs = currentTime - new Date(value).getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));

    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleLogout = () => {
    clearAuthSession("seller");
    navigate("/login", { replace: true });
  };

  return (
    <header className="seller-topbar">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openSidebar}
          className="lg:hidden w-10 h-10 rounded-2xl border border-white/10 bg-white/8 flex items-center justify-center"
        >
          <Menu size={24} />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-2xl font-bold truncate">
            Welcome{seller?.name ? `, ${seller.name}` : ""} <span className="inline-block">👋</span>
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <p className="text-white/60">Manage your store</p>
            <span
              className="px-2 py-1 rounded-full text-[11px] font-semibold border"
              style={{
                color: premiumActive ? "#d8b4fe" : "#cbd5e1",
                borderColor: premiumActive
                  ? "rgba(168, 85, 247, 0.3)"
                  : "rgba(148, 163, 184, 0.2)",
                background: premiumActive
                  ? "rgba(168, 85, 247, 0.14)"
                  : "rgba(148, 163, 184, 0.12)",
              }}
            >
              {sellerPlanStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="seller-topbar-actions flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl w-[min(300px,24vw)]">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>

        <div className="relative">
          <button
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition"
            onClick={() => {
              setShowNotifications((value) => !value);
              setShowProfileMenu(false);
            }}
            aria-label="Seller order notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="seller-notification-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="seller-notification-menu">
              <div className="seller-notification-header">
                <strong>Notifications</strong>
                <div>
                  <button type="button">Mark all as read</button>
                  <Settings size={14} />
                </div>
              </div>

              <div className="seller-notification-list">
                {notifications.length === 0 ? (
                  <p className="seller-notification-empty">No order notifications yet.</p>
                ) : (
                  notifications.slice(0, 5).map((item) => {
                    const meta = getNotificationMeta(item.status);
                    const Icon = meta.icon;

                    return (
                      <button
                        type="button"
                        key={item.id}
                        className="seller-notification-item"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/seller/orders");
                        }}
                      >
                        <span className={`seller-notification-dot ${item.isNew ? "new" : ""}`} />
                        <span className={`seller-notification-icon ${meta.tone}`}>
                          <Icon size={18} />
                        </span>
                        <span className="seller-notification-copy">
                          <strong>{meta.title}</strong>
                          <small>
                            Order #{item.orderNumber} {meta.message}
                          </small>
                          <em>{formatTimeAgo(item.createdAt)}</em>
                        </span>
                        {item.isNew && <b>New</b>}
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                className="seller-notification-view"
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/seller/orders");
                }}
              >
                View all orders
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="seller-profile-btn"
          >
            {seller?.avatar ? (
              <img src={seller.avatar} alt={seller.name || "Seller"} />
            ) : (
              <UserCircle2 size={20} />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              <button
                onClick={() => {
                  navigate("/seller/settings");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition flex items-center gap-2"
              >
                <UserCircle2 size={16} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm hover:bg-red-600 transition flex items-center gap-2 text-red-400 hover:text-white"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
