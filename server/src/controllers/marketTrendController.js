const { ordersStore, productsStore } = require("../db/datastores");
const { hasPremiumPlan } = require("../utils/planUtils");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const safeDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const normalizeProduct = (product = {}) => ({
  id: product._id,
  name: product.name || "Product",
  category: product.category || "Other",
  image: product.images?.[0] || "",
  images: product.images || [],
  price: Number(product.price || 0),
  stock: Number(product.stock || 0),
  sellerId: product.sellerId,
  sellerName: product.sellerName || "Seller",
  shortDesc: product.shortDesc || "",
  description: product.description || product.shortDesc || "",
  brand: product.brand || "",
});

const getOrderItems = (order = {}) => {
  if (Array.isArray(order.items) && order.items.length) return order.items;
  return (order.subOrders || []).flatMap((subOrder) => subOrder.items || []);
};

const calculateGrowth = (currentSales, previousSales) => {
  if (!previousSales && currentSales) return 100;
  if (!previousSales) return 0;
  return Math.round(((currentSales - previousSales) / previousSales) * 100);
};

const getMarketTrends = async (req, res) => {
  if (!hasPremiumPlan(req.user)) {
    return res.status(403).json({
      message: "Premium plan required to access market trends",
    });
  }

  const days = Number(req.query.days || 7) === 30 ? 30 : 7;
  const selectedCategory = String(req.query.category || "all");
  const now = Date.now();
  const currentStart = now - days * MS_PER_DAY;
  const previousStart = now - days * 2 * MS_PER_DAY;

  const [products, orders] = await Promise.all([
    productsStore.find({}),
    ordersStore.find({}),
  ]);
  const productMap = new Map(products.map((product) => [product._id, normalizeProduct(product)]));
  const trendMap = new Map();

  products.forEach((product) => {
    const formatted = normalizeProduct(product);
    trendMap.set(formatted.id, {
      ...formatted,
      currentSales: 0,
      previousSales: 0,
      totalSales: 0,
      currentRevenue: 0,
      previousRevenue: 0,
      sellerCount: new Set([formatted.sellerId].filter(Boolean)),
    });
  });

  orders.forEach((order) => {
    const createdAt = safeDate(order.createdAt);
    if (!createdAt) return;

    const time = createdAt.getTime();
    if (time < previousStart) return;

    getOrderItems(order).forEach((item) => {
      const product = productMap.get(item.productId);
      if (!product) return;
      if (selectedCategory !== "all" && product.category !== selectedCategory) return;

      const entry = trendMap.get(product.id);
      const quantity = Number(item.quantity || 0);
      const revenue = Number(item.lineTotal || product.price * quantity || 0);

      entry.totalSales += quantity;
      entry.sellerCount.add(item.sellerId || product.sellerId);

      if (time >= currentStart) {
        entry.currentSales += quantity;
        entry.currentRevenue += revenue;
      } else {
        entry.previousSales += quantity;
        entry.previousRevenue += revenue;
      }
    });
  });

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  );

  const trends = Array.from(trendMap.values())
    .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
    .map((item) => {
      const growth = calculateGrowth(item.currentSales, item.previousSales);
      const demandScore = Math.min(
        100,
        Math.round(item.currentSales * 12 + Math.max(growth, 0) * 0.5 + item.sellerCount.size * 8)
      );

      return {
        ...item,
        sellerCount: item.sellerCount.size,
        growth,
        demandScore,
        priceRange: item.price ? `PKR ${item.price.toLocaleString("en-PK")}` : "Price varies",
        badge:
          demandScore >= 75
            ? "High Demand"
            : growth >= 25
              ? `${growth}% Growth`
              : "Trending",
        recommendation:
          demandScore >= 75
            ? "This product is in high demand. Consider adding it to increase your revenue."
            : "Demand is rising in the marketplace. Test this product with a small stock first.",
        growthTrail: [item.previousSales, Math.max(item.previousSales, item.currentSales / 2), item.currentSales],
      };
    })
    .sort((a, b) => b.growth - a.growth || b.currentSales - a.currentSales || b.demandScore - a.demandScore)
    .slice(0, 10);

  const topNames = trends.slice(0, 2).map((item) => item.name).join(" and ");

  return res.json({
    days,
    categories,
    summary: topNames
      ? `${topNames} are trending in the last ${days} days. Adding similar products can help capture current marketplace demand.`
      : "Marketplace trends will appear after products start receiving orders.",
    trends,
  });
};

module.exports = {
  getMarketTrends,
};
