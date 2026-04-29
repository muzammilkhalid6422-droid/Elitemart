import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BadgePlus,
  Flame,
  PackagePlus,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import ProtectedPremiumRoute from "../../components/ProtectedPremiumRoute";
import { createProduct } from "../../services/productService";
import { getMarketTrends } from "../../services/marketTrendService";
import "./Marketing.css";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='650' viewBox='0 0 900 650'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%230ea5e9'/%3E%3Cstop offset='.52' stop-color='%234f46e5'/%3E%3Cstop offset='1' stop-color='%239333ea'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='650' fill='%2307131f'/%3E%3Ccircle cx='690' cy='120' r='210' fill='url(%23a)' opacity='.45'/%3E%3Crect x='240' y='180' width='420' height='290' rx='38' fill='url(%23a)' opacity='.9'/%3E%3Cpath d='M310 390h280M330 330h240M360 270h180' stroke='white' stroke-width='28' stroke-linecap='round' opacity='.75'/%3E%3Ctext x='450' y='555' text-anchor='middle' fill='white' font-family='Arial' font-size='44' font-weight='700'%3ETrending Product%3C/text%3E%3C/svg%3E";

const formatNumber = (value) => Number(value || 0).toLocaleString("en-PK");

const Marketing = () => {
  const [seller] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [days, setDays] = useState(7);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ summary: "", categories: [], trends: [] });
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadTrends = async () => {
      try {
        setLoading(true);
        const trendData = await getMarketTrends({ days, category });
        if (!ignore) setData(trendData);
      } catch (error) {
        if (!ignore) {
          setMessage(error.response?.data?.message || "Market trends load nahi ho sake");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadTrends();
    const intervalId = setInterval(loadTrends, 45000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [days, category]);

  const trends = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data.trends || [];

    return (data.trends || []).filter((product) =>
      [product.name, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [data.trends, query]);

  const demandChart = useMemo(
    () =>
      trends.slice(0, 6).map((product) => ({
        name: product.name,
        score: product.demandScore,
        sales: product.currentSales,
      })),
    [trends]
  );

  const handleAddToStore = async (product) => {
    try {
      setAddingId(product.id);
      setMessage("");
      await createProduct({
        name: product.name,
        category: product.category,
        price: product.price || 0,
        stock: 10,
        brand: product.brand || "",
        sku: `TREND-${String(product.id).slice(-6).toUpperCase()}`,
        shortDesc: product.shortDesc || product.recommendation,
        description: product.description || product.recommendation,
        featured: true,
        images: product.image ? [product.image] : [],
      });
      setMessage(`${product.name} aap ke store me add ho gaya`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Product add nahi ho saka");
    } finally {
      setAddingId("");
    }
  };

  const tooltipStyle = {
    background: "rgba(8, 13, 30, 0.96)",
    border: "1px solid rgba(56, 189, 248, 0.28)",
    borderRadius: 12,
    color: "#fff",
  };

  return (
    <ProtectedPremiumRoute seller={seller}>
      <div className="market-trends-page">
        <section className="market-trends-hero">
          <div className="market-trends-hero-copy">
            <span className="market-trends-kicker">
              <Sparkles size={15} />
              Premium Market Intelligence
            </span>
            <h1>Market Trends</h1>
            <p>{data.summary || "Discover fast-growing products from overall marketplace demand."}</p>
          </div>
          <div className="market-trends-controls">
            <div className="market-trends-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search trending products"
              />
            </div>
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {data.categories?.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        {message && <div className="market-trends-message">{message}</div>}

        <section className="market-trends-insights">
          <article>
            <Flame size={22} />
            <span>Trending Products</span>
            <strong>{loading ? "..." : trends.length}</strong>
          </article>
          <article>
            <TrendingUp size={22} />
            <span>Top Growth</span>
            <strong>{loading ? "..." : `${Math.max(...trends.map((item) => item.growth), 0)}%`}</strong>
          </article>
          <article>
            <Zap size={22} />
            <span>High Demand</span>
            <strong>{loading ? "..." : trends.filter((item) => item.demandScore >= 75).length}</strong>
          </article>
        </section>

        <section className="market-trends-chart">
          <div>
            <h2>Demand Score</h2>
            <p>Top trending products ranked by growth, sales, and seller activity.</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={demandChart}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
              <YAxis stroke="rgba(255,255,255,0.55)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="score" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="sales" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {loading ? (
          <section className="market-trends-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <article className="market-trend-card skeleton" key={index}>
                <div />
                <span />
                <strong />
                <p />
              </article>
            ))}
          </section>
        ) : (
          <section className="market-trends-grid">
            {trends.map((product) => (
              <article className="market-trend-card" key={product.id}>
                <div className="market-trend-image">
                  <img
                    src={product.image || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    loading="lazy"
                  />
                  <span className="market-trend-badge">
                    <ArrowUpRight size={14} />
                    {product.badge}
                  </span>
                </div>

                <div className="market-trend-body">
                  <div className="market-trend-topline">
                    <span>{product.category}</span>
                    <b>{product.priceRange}</b>
                  </div>
                  <h2>{product.name}</h2>

                  <div className="market-trend-metrics">
                    <div>
                      <small>Sales</small>
                      <strong>{formatNumber(product.currentSales)}</strong>
                    </div>
                    <div>
                      <small>Growth</small>
                      <strong>{product.growth}%</strong>
                    </div>
                    <div>
                      <small>Demand</small>
                      <strong>{product.demandScore}/100</strong>
                    </div>
                  </div>

                  <div className="market-trend-mini">
                    <ResponsiveContainer width="100%" height={54}>
                      <AreaChart
                        data={product.growthTrail.map((value, index) => ({
                          step: index + 1,
                          value,
                        }))}
                      >
                        <defs>
                          <linearGradient id={`trend-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.7} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#38bdf8"
                          fill={`url(#trend-${product.id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <p>{product.recommendation}</p>

                  <div className="market-trend-footer">
                    <span>
                      <BadgePlus size={14} />
                      {product.sellerCount} sellers selling
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddToStore(product)}
                      disabled={addingId === product.id}
                    >
                      <PackagePlus size={16} />
                      {addingId === product.id ? "Adding..." : "Add to My Store"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && !trends.length && (
          <div className="market-trends-empty">
            No trending products found for this filter yet.
          </div>
        )}
      </div>
    </ProtectedPremiumRoute>
  );
};

export default Marketing;
