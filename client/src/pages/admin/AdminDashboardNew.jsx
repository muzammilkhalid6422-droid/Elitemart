import { useState, useEffect } from "react";
import {
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  ArrowUp,
} from "lucide-react";
import api from "../../services/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, sellersRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/sellers"),
      ]);

      // Calculate stats
      const totalUsers = usersRes.data.users?.length || 0;
      const totalSellers = sellersRes.data.sellers?.length || 0;

      setStats({
        totalUsers,
        totalSellers,
        totalOrders: Math.floor(totalUsers * 2.5), // Mock calculation
        totalRevenue: (Math.floor(totalUsers * 2.5) * 500).toLocaleString(),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading Dashboard...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p className="dashboard-subtitle">Welcome to your admin panel</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        {/* Total Users Card */}
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value">{stats.totalUsers}</h3>
            <span className="stat-change positive">
              <ArrowUp size={14} /> 12% this month
            </span>
          </div>
        </div>

        {/* Total Sellers Card */}
        <div className="stat-card">
          <div className="stat-icon sellers">
            <Store size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Sellers</p>
            <h3 className="stat-value">{stats.totalSellers}</h3>
            <span className="stat-change positive">
              <ArrowUp size={14} /> 5% this month
            </span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="stat-card">
          <div className="stat-icon orders">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h3 className="stat-value">{stats.totalOrders}</h3>
            <span className="stat-change positive">
              <ArrowUp size={14} /> 8% this month
            </span>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="stat-card">
          <div className="stat-icon revenue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Revenue</p>
            <h3 className="stat-value">Rs. {stats.totalRevenue}</h3>
            <span className="stat-change positive">
              <ArrowUp size={14} /> 15% this month
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-section">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue Trend</h3>
            <select className="chart-filter">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <p>Chart implementation coming soon</p>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot success"></div>
              <div className="activity-info">
                <p>New seller registered</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-info">
                <p>New order placed</p>
                <span>4 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot warning"></div>
              <div className="activity-info">
                <p>Seller approval pending</p>
                <span>1 day ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-info">
                <p>New user registration</p>
                <span>2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <Store size={20} />
            Manage Sellers
          </button>
          <button className="action-btn">
            <Users size={20} />
            View Users
          </button>
          <button className="action-btn">
            <ShoppingCart size={20} />
            View Orders
          </button>
          <button className="action-btn">
            <BarChart3 size={20} />
            Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
