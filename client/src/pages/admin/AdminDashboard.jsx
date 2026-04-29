import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Eye,
  Globe2,
  Package,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../../services/api";
import "./AdminDashboard.css";

const emptyOverview = {
  stats: {
    totalUsers: 0,
    totalSellers: 0,
    approvedSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  },
  users: [],
  pendingSellers: [],
  approvedSellers: [],
  products: [],
  orders: [],
  traffic: {
    totalVisits: 0,
    todayVisits: 0,
    weekVisits: 0,
    monthVisits: 0,
    uniqueVisitors: 0,
    todayUniqueVisitors: 0,
    trend: [],
    topPages: [],
    latestVisits: [],
  },
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const formatCurrency = (value) =>
  `PKR ${Number(value || 0).toLocaleString()}`;

const AdminDashboard = () => {
  const [overview, setOverview] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadOverview = async () => {
    setMessage("");

    try {
      const response = await api.get("/admin/overview");
      setOverview({
        ...emptyOverview,
        ...response.data,
        stats: {
          ...emptyOverview.stats,
          ...(response.data.stats || {}),
        },
        traffic: {
          ...emptyOverview.traffic,
          ...(response.data.traffic || {}),
        },
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Admin records load nahi ho sake.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: overview.stats.totalUsers,
        helper: "Registered customers",
        icon: Users,
        tone: "users",
      },
      {
        label: "All Sellers",
        value: overview.stats.totalSellers,
        helper: `${overview.stats.approvedSellers} approved, ${overview.stats.pendingSellers} pending`,
        icon: Store,
        tone: "sellers",
      },
      {
        label: "All Products",
        value: overview.stats.totalProducts,
        helper: "Products from sellers",
        icon: Package,
        tone: "products",
      },
      {
        label: "All Orders",
        value: overview.stats.totalOrders,
        helper: formatCurrency(overview.stats.totalRevenue),
        icon: ClipboardList,
        tone: "orders",
      },
    ],
    [overview.stats]
  );

  const trafficCards = useMemo(
    () => [
      {
        label: "Total Website Traffic",
        value: overview.traffic.totalVisits,
        helper: `${overview.traffic.uniqueVisitors} unique visitors`,
        icon: Globe2,
        tone: "traffic",
      },
      {
        label: "Today Visits",
        value: overview.traffic.todayVisits,
        helper: `${overview.traffic.todayUniqueVisitors} unique today`,
        icon: Eye,
        tone: "today",
      },
      {
        label: "Last 7 Days",
        value: overview.traffic.weekVisits,
        helper: "Website visits this week",
        icon: TrendingUp,
        tone: "week",
      },
    ],
    [overview.traffic]
  );

  const maxTrendVisits = Math.max(
    1,
    ...(overview.traffic.trend || []).map((item) => Number(item.visits || 0))
  );

  if (loading) {
    return <div className="admin-loading">Loading admin records...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header admin-dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Users, sellers, approved sellers, products and order records.
          </p>
        </div>
        <button className="refresh-btn" onClick={loadOverview}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && <div className="admin-message error">{message}</div>}

      <div className="stats-grid">
        {stats.map((item) => (
          <div className="stat-card" key={item.label}>
            <div className={`stat-icon ${item.tone}`}>
              <item.icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">{item.label}</p>
              <h3 className="stat-value">{item.value}</h3>
              <span className="stat-change positive">{item.helper}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="traffic-section">
        <div className="traffic-header">
          <div>
            <h2>Website Traffic</h2>
            <p>Track how many visits are coming to your website.</p>
          </div>
          <span>{overview.traffic.monthVisits} visits in last 30 days</span>
        </div>

        <div className="traffic-card-grid">
          {trafficCards.map((item) => (
            <article className="traffic-stat-card" key={item.label}>
              <div className={`traffic-stat-icon ${item.tone}`}>
                <item.icon size={22} />
              </div>
              <div>
                <span>{item.label}</span>
                <strong>{Number(item.value || 0).toLocaleString()}</strong>
                <small>{item.helper}</small>
              </div>
            </article>
          ))}
        </div>

        <div className="traffic-visual-grid">
          <div className="traffic-chart-card">
            <div className="traffic-chart-head">
              <h3>Last 7 Days Traffic</h3>
              <span>Live page visits</span>
            </div>
            <div className="traffic-bars">
              {(overview.traffic.trend || []).map((item) => (
                <div className="traffic-bar-item" key={item.date}>
                  <div className="traffic-bar-track">
                    <i style={{ height: `${Math.max(8, (Number(item.visits || 0) / maxTrendVisits) * 100)}%` }} />
                  </div>
                  <strong>{item.visits}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="traffic-pages-card">
            <div className="traffic-chart-head">
              <h3>Top Pages</h3>
              <span>Most visited pages</span>
            </div>
            <div className="traffic-page-list">
              {overview.traffic.topPages.length === 0 ? (
                <p>No traffic recorded yet.</p>
              ) : (
                overview.traffic.topPages.map((page) => (
                  <article key={page.path}>
                    <span>{page.path}</span>
                    <strong>{page.count}</strong>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-record-grid">
        <div className="record-card">
          <div className="record-card-header">
            <h2>User Record</h2>
            <span>{overview.users.length}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {overview.users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No users found</td>
                  </tr>
                ) : (
                  overview.users.slice(0, 8).map((user) => (
                    <tr key={user._id}>
                      <td>{user.name || "-"}</td>
                      <td>{user.email || "-"}</td>
                      <td>{user.phone || "-"}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="record-card">
          <div className="record-card-header">
            <h2>Approved Sellers</h2>
            <span>{overview.approvedSellers.length}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.approvedSellers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No approved sellers</td>
                  </tr>
                ) : (
                  overview.approvedSellers.slice(0, 8).map((seller) => (
                    <tr key={seller._id}>
                      <td>{seller.name || "-"}</td>
                      <td>{seller.companyName || "-"}</td>
                      <td>{seller.email || "-"}</td>
                      <td>
                        <span className="status-badge active">
                          <CheckCircle2 size={13} />
                          Approved
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="record-card">
          <div className="record-card-header">
            <h2>Pending Sellers</h2>
            <span>{overview.pendingSellers.length}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.pendingSellers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No pending sellers</td>
                  </tr>
                ) : (
                  overview.pendingSellers.slice(0, 8).map((seller) => (
                    <tr key={seller._id}>
                      <td>{seller.name || "-"}</td>
                      <td>{seller.companyName || "-"}</td>
                      <td>{seller.email || "-"}</td>
                      <td>
                        <span className="status-badge pending">
                          <AlertCircle size={13} />
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="record-card">
          <div className="record-card-header">
            <h2>All Products</h2>
            <span>{overview.products.length}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {overview.products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No products found</td>
                  </tr>
                ) : (
                  overview.products.slice(0, 10).map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className="product-cell">
                          {product.image ? <img src={product.image} alt={product.name} /> : <Boxes size={18} />}
                          {product.name || "-"}
                        </span>
                      </td>
                      <td>{product.sellerName || "-"}</td>
                      <td>{product.category || "-"}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="record-card wide">
          <div className="record-card-header">
            <h2>All Order Record</h2>
            <span>{overview.orders.length}</span>
          </div>
          <div className="table-scroll">
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {overview.orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">No orders found</td>
                  </tr>
                ) : (
                  overview.orders.slice(0, 12).map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber || "-"}</td>
                      <td>
                        <div>{order.customer?.name || "-"}</div>
                        <small>{order.customer?.email || "-"}</small>
                      </td>
                      <td>
                        {(order.subOrders || [])
                          .flatMap((subOrder) => subOrder.items || [])
                          .map((item) => item.productName)
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td>{order.totalItems}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <span className="status-badge pending">{order.status || "Pending"}</span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
