import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Package, ShoppingCart, Store, Users } from "lucide-react";
import api from "../../services/api";
import "./AdminPages.css";

const COLORS = ["#667eea", "#27ae60", "#f39c12", "#e74c3c", "#4facfe", "#9b59b6"];

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await api.get("/admin/overview");
        setOverview(response.data);
      } catch (error) {
        setMessage(error.response?.data?.message || "Analytics data load nahi ho saka");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const analytics = useMemo(() => {
    const stats = overview?.stats || {};
    const orders = overview?.orders || [];
    const products = overview?.products || [];
    const sellers = overview?.sellers || [];
    const users = overview?.users || [];

    const orderStatusMap = orders.reduce((acc, order) => {
      const status = order.status || "Pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const orderStatusData = Object.entries(orderStatusMap).map(([name, value]) => ({
      name,
      value,
    }));

    const sellerSales = orders.reduce((acc, order) => {
      (order.subOrders || []).forEach((subOrder) => {
        const key = subOrder.sellerName || "Seller";
        acc[key] = (acc[key] || 0) + Number(subOrder.subtotal || 0);
      });
      return acc;
    }, {});

    const topSellerData = Object.entries(sellerSales)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const categoryMap = products.reduce((acc, product) => {
      const category = product.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    const lowStock = products
      .filter((product) => Number(product.stock || 0) <= 5)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 8);

    return {
      stats,
      orders,
      products,
      sellers,
      users,
      orderStatusData,
      topSellerData,
      categoryData,
      lowStock,
    };
  }, [overview]);

  if (loading) {
    return <div className="admin-loading">Loading analytics...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Analytics & Reports</h1>
        <p>Marketplace performance, seller revenue, orders and inventory insights</p>
      </div>

      {message && <div className="admin-message error">{message}</div>}

      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <Users size={24} />
          <span>Total Users</span>
          <strong>{analytics.stats.totalUsers || analytics.users.length}</strong>
        </div>
        <div className="analytics-stat-card">
          <Store size={24} />
          <span>Approved Sellers</span>
          <strong>{analytics.stats.approvedSellers || 0}</strong>
        </div>
        <div className="analytics-stat-card">
          <Package size={24} />
          <span>Total Products</span>
          <strong>{analytics.stats.totalProducts || analytics.products.length}</strong>
        </div>
        <div className="analytics-stat-card">
          <ShoppingCart size={24} />
          <span>Total Revenue</span>
          <strong>{formatCurrency(analytics.stats.totalRevenue)}</strong>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="analytics-card-header">
            <h2>Order Status</h2>
            <BarChart3 size={18} />
          </div>
          <div className="analytics-chart">
            {analytics.orderStatusData.length === 0 ? (
              <p className="empty-chart">No order data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {analytics.orderStatusData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="analytics-legend">
            {analytics.orderStatusData.map((item, index) => (
              <span key={item.name}>
                <i style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <h2>Top Seller Revenue</h2>
            <Store size={18} />
          </div>
          <div className="analytics-chart">
            {analytics.topSellerData.length === 0 ? (
              <p className="empty-chart">No seller sales yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topSellerData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <h2>Product Categories</h2>
            <Package size={18} />
          </div>
          <div className="analytics-list">
            {analytics.categoryData.length === 0 ? (
              <p className="empty-chart">No products yet</p>
            ) : (
              analytics.categoryData.map((item, index) => (
                <div className="analytics-list-row" key={item.name}>
                  <span>
                    <i style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {item.name}
                  </span>
                  <strong>{item.value}</strong>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <h2>Low Stock Alerts</h2>
            <Package size={18} />
          </div>
          <div className="analytics-list">
            {analytics.lowStock.length === 0 ? (
              <p className="empty-chart">No low stock products</p>
            ) : (
              analytics.lowStock.map((product) => (
                <div className="analytics-list-row" key={product.id}>
                  <span>{product.name}</span>
                  <strong>{product.stock} left</strong>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminAnalytics;
