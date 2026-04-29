import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  PackageSearch,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import ProtectedPremiumRoute from "../../components/ProtectedPremiumRoute";
import { getSellerOrders } from "../../services/orderService";
import { getSellerProducts } from "../../services/productService";
import { buildSellerInsights } from "../../services/aiInsightsService";

const AIInsights = () => {
  const [seller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadInsights = async () => {
      try {
        const [orderData, productData] = await Promise.all([
          getSellerOrders(),
          getSellerProducts(),
        ]);

        if (!ignore) {
          setOrders(orderData || []);
          setProducts(productData || []);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadInsights();
    const intervalId = setInterval(loadInsights, 30000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const insights = useMemo(() => buildSellerInsights(orders, products), [orders, products]);

  const cards = [
    {
      title: "Weekly Sales",
      value: insights.formatCurrency(insights.weeklySales),
      note: `${insights.growth >= 0 ? "+" : ""}${insights.growth}% vs previous week`,
      icon: TrendingUp,
      tone: "cyan",
    },
    {
      title: "Orders",
      value: insights.orderStats.total,
      note: `${insights.orderStats.pending} pending, ${insights.orderStats.completed} completed`,
      icon: ClipboardList,
      tone: "blue",
    },
    {
      title: "Customers",
      value: insights.totalCustomers,
      note: `${insights.repeatPurchaseRate}% repeat purchase rate`,
      icon: Users,
      tone: "violet",
    },
    {
      title: "Low Stock",
      value: insights.lowStockProducts.length,
      note: "Products need inventory attention",
      icon: AlertTriangle,
      tone: "purple",
    },
  ];

  return (
    <ProtectedPremiumRoute seller={seller}>
      <div className="seller-dashboard">
        <section className="seller-dashboard-hero">
          <div>
            <h1>AI Business Insights</h1>
            <p>
              Premium smart seller insights generated from orders, products,
              customers, inventory, and pricing behavior.
            </p>
          </div>
          <span className="seller-premium-pill">
            <BrainCircuit size={14} />
            Premium Feature
          </span>
        </section>

        <section className="seller-record-grid">
          {cards.map((card) => (
            <article className="seller-record-card" key={card.title}>
              <div className={`seller-record-icon ${card.tone}`}>
                <card.icon size={22} />
              </div>
              <p>{card.title}</p>
              <h2>{loading ? "..." : card.value}</h2>
              <span>{card.note}</span>
            </article>
          ))}
        </section>

        <section className="seller-panel" style={{ marginBottom: 16 }}>
          <div className="seller-panel-header">
            <h2>
              <Sparkles size={18} />
              AI Weekly Summary
            </h2>
            <span>Rule-based AI</span>
          </div>
          <p className="seller-muted" style={{ lineHeight: 1.8 }}>
            {loading ? "Generating your seller summary..." : insights.summary}
          </p>
        </section>

        <div className="seller-dashboard-grid">
          <section className="seller-panel seller-sales-panel">
            <div className="seller-panel-header">
              <h2>
                <TrendingUp size={18} />
                Sales, Orders & Customers
              </h2>
              <span>Last 7 days</span>
            </div>
            <div className="seller-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.chartData}>
                  <defs>
                    <linearGradient id="aiSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.65)" />
                  <YAxis stroke="rgba(255,255,255,0.55)" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(8, 13, 30, 0.95)",
                      border: "1px solid rgba(96, 165, 250, 0.35)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    fill="url(#aiSalesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <aside className="seller-side-stack">
            <section className="seller-panel">
              <div className="seller-panel-header">
                <h2>
                  <BrainCircuit size={18} />
                  AI Recommendations
                </h2>
              </div>
              <div className="seller-order-list">
                {insights.recommendations.map((item) => (
                  <div className="seller-order-row" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>
                    <b>{item.priority}</b>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <div className="seller-dashboard-grid" style={{ marginTop: 16 }}>
          <section className="seller-panel">
            <div className="seller-panel-header">
              <h2>
                <PackageSearch size={18} />
                Product Performance
              </h2>
              <span>Best sellers</span>
            </div>
            <div className="seller-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.bestProducts}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                  <YAxis stroke="rgba(255,255,255,0.55)" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(8, 13, 30, 0.95)",
                      border: "1px solid rgba(96, 165, 250, 0.35)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="quantity" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <aside className="seller-side-stack">
            <section className="seller-panel">
              <div className="seller-panel-header">
                <h2>
                  <Zap size={18} />
                  Pricing & Inventory
                </h2>
              </div>
              <div className="seller-product-list">
                {insights.fastSellingItems.slice(0, 3).map((product) => (
                  <div className="seller-product-row" key={product.id}>
                    <div>
                      <span>Increase price: {product.name}</span>
                      <b>High demand</b>
                    </div>
                    <i style={{ width: "86%" }} />
                  </div>
                ))}
                {insights.slowMovingProducts.slice(0, 3).map((product) => (
                  <div className="seller-product-row" key={product.id || product.name}>
                    <div>
                      <span>Discount: {product.name}</span>
                      <b>Slow item</b>
                    </div>
                    <i style={{ width: "34%" }} />
                  </div>
                ))}
                {!insights.fastSellingItems.length && !insights.slowMovingProducts.length && (
                  <p className="seller-muted">No pricing alerts yet.</p>
                )}
              </div>
            </section>
          </aside>
        </div>

        <section className="seller-mini-grid" style={{ marginTop: 16 }}>
          <article className="seller-mini-card">
            <ClipboardList size={22} />
            <div>
              <p>Daily Sales</p>
              <h3>{insights.formatCurrency(insights.dailySales)}</h3>
            </div>
          </article>
          <article className="seller-mini-card">
            <TrendingUp size={22} />
            <div>
              <p>Monthly Sales</p>
              <h3>{insights.formatCurrency(insights.monthlySales)}</h3>
            </div>
          </article>
          <article className="seller-mini-card">
            <Users size={22} />
            <div>
              <p>Top Category</p>
              <h3>{insights.activeCategories[0]?.[0] || "N/A"}</h3>
            </div>
          </article>
          <article className="seller-mini-card">
            <AlertTriangle size={22} />
            <div>
              <p>Cancelled</p>
              <h3>{insights.orderStats.cancelled}</h3>
            </div>
          </article>
        </section>
      </div>
    </ProtectedPremiumRoute>
  );
};

export default AIInsights;
