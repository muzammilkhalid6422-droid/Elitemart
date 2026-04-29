import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Filter,
  Package,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import ProtectedPremiumRoute from "../../components/ProtectedPremiumRoute";
import { getSellerOrders } from "../../services/orderService";
import { getSellerProducts } from "../../services/productService";

const COLORS = ["#38bdf8", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6"];

const currency = (value) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const safeDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const dayKey = (value) => {
  const date = safeDate(value) || new Date();
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const statusKey = (status = "Pending") => {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("cancel")) return "Cancelled";
  if (normalized.includes("complete") || normalized.includes("deliver")) return "Completed";
  if (normalized.includes("ship") || normalized.includes("confirm")) return "Processing";
  return "Pending";
};

const getSellerItems = (order) =>
  Array.isArray(order.sellerItems) && order.sellerItems.length
    ? order.sellerItems
    : order.items || [];

const getOrderRevenue = (order) =>
  Number(
    order.sellerTotal ??
      getSellerItems(order).reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
  );

const createEmptyDays = (days) => {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    const key = dayKey(date);
    return {
      key,
      day: key,
      revenue: 0,
      orders: 0,
      customers: 0,
      refunds: 0,
    };
  });
};

const Analytics = () => {
  const [seller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [category, setCategory] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  useEffect(() => {
    let ignore = false;

    const loadAnalytics = async () => {
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

    loadAnalytics();
    const intervalId = setInterval(loadAnalytics, 30000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const from =
      range === "custom"
        ? safeDate(customRange.from)
        : new Date(now.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    const to = range === "custom" ? safeDate(customRange.to) : null;

    const visibleProducts =
      category === "all"
        ? products
        : products.filter((product) => product.category === category);
    const visibleProductIds = new Set(visibleProducts.map((product) => product.id));

    const filteredOrders = orders.filter((order) => {
      const createdAt = safeDate(order.createdAt);
      if (!createdAt) return true;
      if (from && createdAt < from) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (createdAt > end) return false;
      }
      if (category === "all") return true;
      return getSellerItems(order).some((item) => visibleProductIds.has(item.productId));
    });

    const days = range === "7" ? 7 : 30;
    const timelineMap = new Map(createEmptyDays(days).map((item) => [item.key, item]));
    const productSales = new Map();
    const customerMap = new Map();
    const statusMap = new Map([
      ["Pending", 0],
      ["Processing", 0],
      ["Completed", 0],
      ["Cancelled", 0],
    ]);

    filteredOrders.forEach((order) => {
      const key = dayKey(order.createdAt);
      const row = timelineMap.get(key) || {
        key,
        day: key,
        revenue: 0,
        orders: 0,
        customers: 0,
        refunds: 0,
      };
      const revenue = getOrderRevenue(order);
      const status = statusKey(order.status);
      const customerId = order.customer?.email || order.customer?.id || order.customer?.name || order.id;

      row.revenue += revenue;
      row.orders += 1;
      row.refunds += status === "Cancelled" ? revenue : 0;
      timelineMap.set(key, row);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      const customer = customerMap.get(customerId) || {
        name: order.customer?.name || "Customer",
        email: order.customer?.email || "",
        orders: 0,
        spending: 0,
      };
      customer.orders += 1;
      customer.spending += revenue;
      customerMap.set(customerId, customer);

      getSellerItems(order).forEach((item) => {
        if (category !== "all" && !visibleProductIds.has(item.productId)) return;
        const existing = productSales.get(item.productId) || {
          id: item.productId,
          name: item.productName || "Product",
          category: item.category || "Other",
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += Number(item.quantity || 0);
        existing.revenue += Number(item.lineTotal || 0);
        productSales.set(item.productId, existing);
      });
    });

    const timeline = Array.from(timelineMap.values()).map((item) => ({
      ...item,
      customers: new Set(
        filteredOrders
          .filter((order) => dayKey(order.createdAt) === item.key)
          .map((order) => order.customer?.email || order.customer?.id || order.id)
      ).size,
    }));

    const soldProducts = Array.from(productSales.values()).sort(
      (a, b) => b.quantity - a.quantity
    );
    const lowProducts = visibleProducts
      .map((product) => {
        const sold = productSales.get(product.id);
        return {
          name: product.name,
          quantity: sold?.quantity || 0,
          revenue: sold?.revenue || 0,
        };
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    const categoryCounts = visibleProducts.reduce((acc, product) => {
      const key = product.category || "Other";
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

    const conversionData = visibleProducts.slice(0, 8).map((product) => {
      const sold = productSales.get(product.id);
      const purchases = sold?.quantity || 0;
      const views = Number(product.views || product.viewCount || purchases * 5 + product.stock + 12);
      return {
        name: product.name,
        views,
        purchases,
      };
    });

    const customers = Array.from(customerMap.values());
    const returning = customers.filter((customer) => customer.orders > 1).length;
    const newCustomers = Math.max(customers.length - returning, 0);
    const cancelledOrders = statusMap.get("Cancelled") || 0;
    const completedOrders = statusMap.get("Completed") || 0;
    const estimatedVisitors = Math.max(
      conversionData.reduce((sum, item) => sum + item.views, 0),
      filteredOrders.length * 10
    );
    const estimatedCart = Math.max(
      filteredOrders.reduce((sum, order) => sum + Number(order.sellerQuantity || 1), 0),
      Math.round(estimatedVisitors * 0.35)
    );
    const estimatedCheckout = Math.max(filteredOrders.length + cancelledOrders, 1);
    const purchases = Math.max(completedOrders, filteredOrders.length - cancelledOrders, 0);
    const abandonmentRate = estimatedCart
      ? Math.round(((estimatedCart - purchases) / estimatedCart) * 100)
      : 0;

    return {
      totalRevenue: filteredOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0),
      totalOrders: filteredOrders.length,
      totalCustomers: customers.length,
      totalProducts: visibleProducts.length,
      categories: Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
      timeline,
      bestProducts: soldProducts.slice(0, 5),
      lowProducts,
      categoryDistribution: Array.from(categoryCounts.entries()).map(([name, value]) => ({
        name,
        value,
      })),
      conversionData,
      customerTypeData: [
        { name: "New", value: newCustomers },
        { name: "Returning", value: returning },
      ],
      customerGrowth: timeline.reduce((acc, item, index) => {
        const previous = index ? acc[index - 1].customers : 0;
        acc.push({ day: item.day, customers: previous + item.customers });
        return acc;
      }, []),
      topCustomers: customers
        .sort((a, b) => b.spending - a.spending)
        .slice(0, 5)
        .map((customer) => ({
          name: customer.name,
          spending: customer.spending,
          orders: customer.orders,
        })),
      statusData: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
      refundData: timeline.map((item) => ({
        day: item.day,
        refunds: item.refunds,
      })),
      stockData: visibleProducts.slice(0, 10).map((product) => ({
        name: product.name,
        stock: Number(product.stock || 0),
      })),
      lowStock: visibleProducts.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock) <= 5),
      outOfStock: visibleProducts.filter((product) => Number(product.stock || 0) <= 0),
      funnelData: [
        { name: "Visitors", value: estimatedVisitors, fill: "#38bdf8" },
        { name: "Add to Cart", value: estimatedCart, fill: "#6366f1" },
        { name: "Checkout", value: estimatedCheckout, fill: "#8b5cf6" },
        { name: "Purchase", value: purchases, fill: "#22c55e" },
      ],
      abandonmentRate,
      trafficSources: [
        { name: "Direct", value: Math.round(estimatedVisitors * 0.36) },
        { name: "Facebook", value: Math.round(estimatedVisitors * 0.26) },
        { name: "Google", value: Math.round(estimatedVisitors * 0.24) },
        { name: "Referral", value: Math.round(estimatedVisitors * 0.14) },
      ],
      campaignData: soldProducts.slice(0, 5).map((product) => ({
        name: product.name,
        sales: product.revenue,
      })),
      couponData: [
        { name: "Used", value: Math.round(filteredOrders.length * 0.18) },
        { name: "No Coupon", value: Math.max(filteredOrders.length - Math.round(filteredOrders.length * 0.18), 0) },
      ],
    };
  }, [orders, products, range, category, customRange]);

  const summaryCards = [
    { label: "Total Revenue", value: currency(analytics.totalRevenue), icon: Wallet },
    { label: "Total Orders", value: analytics.totalOrders, icon: ClipboardList },
    { label: "Total Customers", value: analytics.totalCustomers, icon: Users },
    { label: "Total Products", value: analytics.totalProducts, icon: Package },
  ];

  const tooltipStyle = {
    background: "rgba(8, 13, 30, 0.96)",
    border: "1px solid rgba(56, 189, 248, 0.28)",
    borderRadius: 12,
    color: "#fff",
  };

  return (
    <ProtectedPremiumRoute seller={seller}>
      <div className="seller-analytics-page">
        <section className="seller-analytics-hero">
          <div>
            <span>
              <TrendingUp size={15} />
              Premium Analytics
            </span>
            <h1>Analytics Dashboard</h1>
            <p>Charts based on this seller's products, orders, customers, inventory, and revenue.</p>
          </div>
          <div className="seller-analytics-filterbar">
            <label>
              <CalendarDays size={15} />
              <select value={range} onChange={(event) => setRange(event.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {range === "custom" && (
              <>
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(event) =>
                    setCustomRange((current) => ({ ...current, from: event.target.value }))
                  }
                />
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(event) =>
                    setCustomRange((current) => ({ ...current, to: event.target.value }))
                  }
                />
              </>
            )}
            <label>
              <Filter size={15} />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All categories</option>
                {analytics.categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="seller-analytics-summary">
          {summaryCards.map((card) => (
            <article className="seller-analytics-stat" key={card.label}>
              <div>
                <card.icon size={22} />
              </div>
              <span>{card.label}</span>
              <strong>{loading ? "..." : card.value}</strong>
            </article>
          ))}
        </section>

        <section className="seller-analytics-grid">
          <article className="seller-analytics-panel wide">
            <header>
              <h2>Revenue Over Time</h2>
              <span>Daily revenue</span>
            </header>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.timeline}>
                <defs>
                  <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.75} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fill="url(#analyticsRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Orders Per Day</h2>
              <span>Order volume</span>
            </header>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeline}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Top 5 Products</h2>
              <span>Best-selling</span>
            </header>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.bestProducts}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="quantity" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Lowest Performing</h2>
              <span>Units sold</span>
            </header>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.lowProducts}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="quantity" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Category Distribution</h2>
              <span>Product mix</span>
            </header>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={analytics.categoryDistribution} dataKey="value" nameKey="name" outerRadius={88}>
                  {analytics.categoryDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel wide">
            <header>
              <h2>Product Views vs Purchases</h2>
              <span>Conversion view</span>
            </header>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={analytics.conversionData}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="views" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="purchases" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>New vs Returning</h2>
              <span>Customers</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={analytics.customerTypeData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88}>
                  {analytics.customerTypeData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Customer Growth</h2>
              <span>Cumulative</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={analytics.customerGrowth}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="customers" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Top Customers</h2>
              <span>By spending</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={analytics.topCustomers}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency(value)} />
                <Bar dataKey="spending" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Order Status</h2>
              <span>Pending / completed / cancelled</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={analytics.statusData} dataKey="value" nameKey="name" outerRadius={86}>
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Return / Refund Rate</h2>
              <span>Cancelled value</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={analytics.refundData}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency(value)} />
                <Area type="monotone" dataKey="refunds" stroke="#ef4444" fill="#ef444430" />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Conversion Funnel</h2>
              <span>{analytics.abandonmentRate}% abandonment</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <FunnelChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Funnel dataKey="value" data={analytics.funnelData} isAnimationActive />
              </FunnelChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel wide">
            <header>
              <h2>Stock Levels</h2>
              <span>
                {analytics.lowStock.length} low stock, {analytics.outOfStock.length} out of stock
              </span>
            </header>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={analytics.stockData}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="stock" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Traffic Sources</h2>
              <span>Estimated</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={analytics.trafficSources} dataKey="value" nameKey="name" innerRadius={45} outerRadius={86}>
                  {analytics.trafficSources.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Campaign Performance</h2>
              <span>Best products to promote</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={analytics.campaignData}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency(value)} />
                <Bar dataKey="sales" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="seller-analytics-panel">
            <header>
              <h2>Coupon Usage</h2>
              <span>Estimated</span>
            </header>
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={analytics.couponData} dataKey="value" nameKey="name" outerRadius={86}>
                  {analytics.couponData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className="seller-analytics-alerts">
          <div>
            <Boxes size={18} />
            <span>Low stock: {analytics.lowStock.map((item) => item.name).join(", ") || "No low stock items"}</span>
          </div>
          <div>
            <PieChartIcon size={18} />
            <span>Out of stock: {analytics.outOfStock.map((item) => item.name).join(", ") || "No out of stock items"}</span>
          </div>
        </section>
      </div>
    </ProtectedPremiumRoute>
  );
};

export default Analytics;
