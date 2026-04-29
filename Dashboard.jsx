import { useState, useEffect } from "react";
import { Users, Store, Package, ShoppingCart, TrendingUp, Activity } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetching all counts from the backend endpoints
        const [usersRes, sellersRes, productsRes, ordersRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/users", { headers }),
          fetch("http://localhost:5000/api/admin/sellers", { headers }),
          fetch("http://localhost:5000/api/products", { headers }),
          fetch("http://localhost:5000/api/admin/orders", { headers }).catch(() => null) // .catch in case orders route is missing yet
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
        const sellersData = sellersRes.ok ? await sellersRes.json() : { sellers: [] };
        const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
        const ordersData = ordersRes && ordersRes.ok ? await ordersRes.json() : { orders: [] };

        const totalUsers = usersData.users?.length || 0;
        const totalSellers = sellersData.sellers?.length || 0;
        const totalProducts = productsData.products?.length || 0;
        const totalOrders = ordersData.orders?.length || 0;
        
        // Example revenue calculation (modify logic based on your backend response)
        const totalRevenue = totalOrders * 500; 

        setStats({
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          totalRevenue
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-white/60">Loading Dashboard...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cyan-300">Dashboard Overview</h1>
        <p className="text-white/60 mt-2">Welcome to your admin panel. Here are the latest statistics.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Users Card */}
        <div className="p-6 flex items-center gap-5 rounded-2xl" style={cardStyle}>
          <div className="p-4 rounded-xl bg-blue-500/20 text-blue-400">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm text-white/60 uppercase tracking-wide">Total Users</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</h3>
          </div>
        </div>

        {/* Sellers Card */}
        <div className="p-6 flex items-center gap-5 rounded-2xl" style={cardStyle}>
          <div className="p-4 rounded-xl bg-purple-500/20 text-purple-400">
            <Store size={32} />
          </div>
          <div>
            <p className="text-sm text-white/60 uppercase tracking-wide">Total Sellers</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.totalSellers}</h3>
          </div>
        </div>

        {/* Products Card */}
        <div className="p-6 flex items-center gap-5 rounded-2xl" style={cardStyle}>
          <div className="p-4 rounded-xl bg-green-500/20 text-green-400">
            <Package size={32} />
          </div>
          <div>
            <p className="text-sm text-white/60 uppercase tracking-wide">Total Products</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.totalProducts}</h3>
          </div>
        </div>

        {/* Orders Card */}
        <div className="p-6 flex items-center gap-5 rounded-2xl" style={cardStyle}>
          <div className="p-4 rounded-xl bg-yellow-500/20 text-yellow-400">
            <ShoppingCart size={32} />
          </div>
          <div>
            <p className="text-sm text-white/60 uppercase tracking-wide">Total Orders</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.totalOrders}</h3>
          </div>
        </div>

      </div>

      {/* REVENUE SECTION */}
      <div className="grid grid-cols-1 mt-8">
        <div className="p-6 rounded-2xl flex flex-col justify-center" style={cardStyle}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} className="text-cyan-400" />
            <h2 className="text-lg font-semibold text-white/80">Total Revenue Estimate</h2>
          </div>
          <h3 className="text-4xl font-bold text-cyan-300 mt-2">
            PKR {stats.totalRevenue.toLocaleString()}
          </h3>
          <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
            <Activity size={14} /> System Live & Active
          </p>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(0,0,0,0.4))",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.1)"
};

export default Dashboard;
