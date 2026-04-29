import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  BarChart3,
  Box,
  ClipboardList,
  PackageCheck,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { getSellerOrders } from "../../services/orderService";
import { getSellerProducts } from "../../services/productService";
import { getPlanStatus, getRemainingDays, hasPremiumPlan } from "../../services/planService";

const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const getOrderDateKey = (value) => {
  const date = value ? new Date(value) : new Date();
  return chartDays[date.getDay() === 0 ? 6 : date.getDay() - 1];
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    let ignore = false;

    const loadRecords = async () => {
      try {
        const [orderData, productData] = await Promise.all([
          getSellerOrders(),
          getSellerProducts(),
        ]);

        if (!ignore) {
          setOrders(orderData || []);
          setProducts(productData || []);
          const storedUser = localStorage.getItem("user");
          setSeller(storedUser ? JSON.parse(storedUser) : null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.sellerTotal || 0), 0);
    const pendingOrders = orders.filter((order) =>
      (order.sellerSubOrders || []).some((subOrder) => subOrder.status === "Pending")
    ).length;
    const activeOrders = orders.filter((order) =>
      (order.sellerSubOrders || []).some((subOrder) =>
        ["Pending", "Confirmed", "Shipped", "Out for Delivery"].includes(subOrder.status)
      )
    ).length;
    const completedOrders = orders.filter((order) =>
      (order.sellerSubOrders || []).length > 0 &&
      (order.sellerSubOrders || []).every((subOrder) =>
        ["Delivered", "Completed"].includes(subOrder.status)
      )
    ).length;
    const productsSold = orders.reduce(
      (sum, order) => sum + Number(order.sellerQuantity || 0),
      0
    );
    const averageOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;
    const uniqueCustomers = new Set(
      orders.map((order) => order.customer?.email || order.customer?.id).filter(Boolean)
    ).size;
    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5).length;

    return {
      totalRevenue,
      pendingOrders,
      activeOrders,
      completedOrders,
      productsSold,
      averageOrder,
      uniqueCustomers,
      lowStock,
    };
  }, [orders, products]);

  const topProducts = useMemo(() => {
    const counts = new Map();

    orders.forEach((order) => {
      (order.sellerItems || []).forEach((item) => {
        counts.set(item.productName, (counts.get(item.productName) || 0) + item.quantity);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);

  const chartData = useMemo(() => {
    const dayMap = chartDays.reduce((acc, day) => {
      acc[day] = { day, sales: 0, orders: 0 };
      return acc;
    }, {});

    orders.forEach((order) => {
      const key = getOrderDateKey(order.createdAt);
      dayMap[key].sales += Number(order.sellerTotal || 0);
      dayMap[key].orders += 1;
    });

    return chartDays.map((day) => dayMap[day]);
  }, [orders]);

  const recordCards = [
    {
      label: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      trend: "+12.5%",
      icon: TrendingUp,
      tone: "cyan",
    },
    {
      label: "Orders",
      value: orders.length,
      trend: "+25%",
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Active",
      value: stats.activeOrders,
      trend: "+8%",
      icon: Box,
      tone: "violet",
    },
    {
      label: "Pending",
      value: stats.pendingOrders,
      trend: stats.pendingOrders ? "-5%" : "0%",
      icon: RefreshCcw,
      tone: "purple",
    },
  ];

  const miniCards = [
    {
      label: "Plan",
      value: hasPremiumPlan(seller) ? "Premium" : "Free",
      icon: BadgeCheck,
    },
    { label: "Average Order", value: formatCurrency(stats.averageOrder), icon: WalletCards },
    { label: "Completed", value: stats.completedOrders, icon: BadgeCheck },
    { label: "Products Sold", value: stats.productsSold, icon: ShoppingBag },
    { label: "All Products", value: products.length, icon: PackageCheck },
    { label: "Customers", value: stats.uniqueCustomers, icon: Users },
    { label: "Low Stock", value: stats.lowStock, icon: BarChart3 },
  ];

  return (
    <div className="seller-dashboard">
      <section className="seller-dashboard-hero">
        <div>
          <h1>Dashboard</h1>
          <p>
            Track revenue, active orders, customer demand and product performance
            from one responsive console.
          </p>
          <p style={{ marginTop: "10px", color: "rgba(216, 180, 254, 0.9)" }}>
            {getPlanStatus(seller)}
            {hasPremiumPlan(seller) && seller?.planExpiry
              ? ` • Expires in ${getRemainingDays(seller.planExpiry)} days`
              : " • Upgrade to unlock AI Insights, Analytics, and Market Trends"}
          </p>
        </div>
        <span className="seller-premium-pill">
          <BadgeCheck size={14} />
          {hasPremiumPlan(seller) ? "Premium Seller Workspace" : "Free Seller Workspace"}
        </span>
      </section>

      <section className="seller-record-grid">
        {recordCards.map((card) => (
          <article className="seller-record-card" key={card.label}>
            <div className={`seller-record-icon ${card.tone}`}>
              <card.icon size={22} />
            </div>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
            <span>{card.trend} vs last 7 days</span>
          </article>
        ))}
      </section>

      <section className="seller-mini-grid">
        {miniCards.map((card) => (
          <article className="seller-mini-card" key={card.label}>
            <card.icon size={22} />
            <div>
              <p>{card.label}</p>
              <h3>{card.value}</h3>
            </div>
          </article>
        ))}
      </section>

      <div className="seller-dashboard-grid">
        <section className="seller-panel seller-sales-panel">
          <div className="seller-panel-header">
            <h2>
              <BarChart3 size={18} />
              Sales Overview
            </h2>
            <span>Live Summary</span>
          </div>

          <div className="seller-status-row">
            <div className="seller-status-card pending">
              <p>Pending Orders</p>
              <strong>{stats.pendingOrders}</strong>
            </div>
            <div className="seller-status-card active">
              <p>Active Orders</p>
              <strong>{stats.activeOrders}</strong>
            </div>
            <div className="seller-status-card completed">
              <p>Completed Orders</p>
              <strong>{stats.completedOrders}</strong>
            </div>
          </div>

          <div className="seller-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sellerSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5865ff" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#5865ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.65)" tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.55)" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8, 13, 30, 0.95)",
                    border: "1px solid rgba(122, 104, 255, 0.35)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value, name) =>
                    name === "sales" ? [formatCurrency(value), "Sales"] : [value, "Orders"]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#5b7cfa"
                  strokeWidth={3}
                  fill="url(#sellerSalesGradient)"
                  dot={{ r: 4, fill: "#4aa3ff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <aside className="seller-side-stack">
          <section className="seller-panel">
            <div className="seller-panel-header">
              <h2>
                <ClipboardList size={18} />
                Recent Orders
              </h2>
            </div>
            <div className="seller-order-list">
              {loading && <p className="seller-muted">Loading records...</p>}
              {!loading && orders.length === 0 && (
                <p className="seller-muted">Abhi tak koi order nahi aya.</p>
              )}
              {orders.slice(0, 4).map((order) => (
                <div className="seller-order-row" key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.customer?.name || "Customer"}</span>
                  </div>
                  <b>{formatCurrency(order.sellerTotal)}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="seller-panel">
            <div className="seller-panel-header">
              <h2>
                <ShoppingBag size={18} />
                Top Products
              </h2>
            </div>
            <div className="seller-product-list">
              {topProducts.length === 0 && <p className="seller-muted">No sales yet</p>}
              {topProducts.map(([name, quantity], index) => {
                const max = Math.max(...topProducts.map(([, qty]) => qty), 1);
                return (
                  <div className="seller-product-row" key={name}>
                    <div>
                      <span>{index + 1}. {name}</span>
                      <b>x {quantity}</b>
                    </div>
                    <i style={{ width: `${Math.max(12, (quantity / max) * 100)}%` }} />
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
