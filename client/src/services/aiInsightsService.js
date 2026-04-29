const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toDate = (value) => (value ? new Date(value) : new Date());

const isWithinDays = (value, days) => {
  const date = toDate(value);
  const diffMs = Date.now() - date.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
};

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString()}`;

const getOrderDay = (value) => {
  const date = toDate(value);
  return dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
};

const getCustomerKey = (order) => order.customer?.email || order.customer?.id || order.customer?.name;

const getProductSales = (orders) => {
  const productMap = new Map();

  orders.forEach((order) => {
    (order.sellerItems || []).forEach((item) => {
      const key = item.productId || item.productName;
      const current = productMap.get(key) || {
        id: key,
        name: item.productName || "Product",
        category: item.category || "General",
        quantity: 0,
        revenue: 0,
        price: Number(item.price || 0),
      };

      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.lineTotal || item.price * item.quantity || 0);
      productMap.set(key, current);
    });
  });

  return Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
};

export const buildSellerInsights = (orders = [], products = []) => {
  const todayOrders = orders.filter((order) => isWithinDays(order.createdAt, 1));
  const weeklyOrders = orders.filter((order) => isWithinDays(order.createdAt, 7));
  const previousWeekOrders = orders.filter((order) => {
    const diffDays = (Date.now() - toDate(order.createdAt).getTime()) / (24 * 60 * 60 * 1000);
    return diffDays > 7 && diffDays <= 14;
  });
  const monthlyOrders = orders.filter((order) => isWithinDays(order.createdAt, 30));

  // Sales metrics compare current week against previous week for simple growth detection.
  const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + Number(order.sellerTotal || 0), 0);
  const previousWeekRevenue = previousWeekOrders.reduce(
    (sum, order) => sum + Number(order.sellerTotal || 0),
    0
  );
  const growth = previousWeekRevenue
    ? Math.round(((weeklyRevenue - previousWeekRevenue) / previousWeekRevenue) * 100)
    : weeklyRevenue > 0
      ? 100
      : 0;

  const productSales = getProductSales(orders);
  const bestProducts = productSales.slice(0, 5);
  const soldProductIds = new Set(productSales.map((product) => product.id));
  const lowPerformingProducts = products
    .filter((product) => !soldProductIds.has(product.id || product._id))
    .slice(0, 5);

  // Customer behavior is derived from unique buyer keys and repeat order counts.
  const customerCounts = new Map();
  orders.forEach((order) => {
    const key = getCustomerKey(order);
    if (key) customerCounts.set(key, (customerCounts.get(key) || 0) + 1);
  });
  const repeatCustomers = Array.from(customerCounts.values()).filter((count) => count > 1).length;
  const uniqueCustomers = customerCounts.size;
  const repeatPurchaseRate = uniqueCustomers ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

  const categoryMap = new Map();
  productSales.forEach((product) => {
    categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + product.quantity);
  });
  const activeCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Inventory alerts combine stock count with sales velocity.
  const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= 5);
  const fastSellingItems = bestProducts.filter((product) => product.quantity >= 3);
  const slowMovingProducts = products
    .filter((product) => Number(product.stock || 0) > 5 && !soldProductIds.has(product.id || product._id))
    .slice(0, 5);

  const orderStats = {
    total: orders.length,
    pending: orders.filter((order) =>
      (order.sellerSubOrders || []).some((subOrder) => subOrder.status === "Pending")
    ).length,
    completed: orders.filter((order) =>
      (order.sellerSubOrders || []).some((subOrder) =>
        ["Delivered", "Completed"].includes(subOrder.status)
      )
    ).length,
    cancelled: orders.filter((order) =>
      (order.sellerSubOrders || []).some((subOrder) => subOrder.status === "Cancelled")
    ).length,
  };

  const chartData = dayLabels.map((day) => ({ day, sales: 0, orders: 0, customers: 0 }));
  const dayCustomerMap = new Map();
  weeklyOrders.forEach((order) => {
    const day = getOrderDay(order.createdAt);
    const row = chartData.find((item) => item.day === day);
    row.sales += Number(order.sellerTotal || 0);
    row.orders += 1;
    const key = getCustomerKey(order);
    if (key) {
      const set = dayCustomerMap.get(day) || new Set();
      set.add(key);
      dayCustomerMap.set(day, set);
      row.customers = set.size;
    }
  });

  const topProduct = bestProducts[0];
  const recommendations = [
    topProduct
      ? {
          title: `Promote ${topProduct.name}`,
          body: `${topProduct.name} is your best-selling product with ${topProduct.quantity} units sold.`,
          priority: "High",
        }
      : {
          title: "Start a launch campaign",
          body: "No clear best-seller yet. Promote your newest products to create demand.",
          priority: "Medium",
        },
    lowStockProducts[0]
      ? {
          title: `Restock ${lowStockProducts[0].name}`,
          body: `${lowStockProducts[0].name} is running low. Restock soon to avoid missed sales.`,
          priority: "High",
        }
      : {
          title: "Inventory looks stable",
          body: "No critical low-stock products detected right now.",
          priority: "Low",
        },
    slowMovingProducts[0]
      ? {
          title: `Discount ${slowMovingProducts[0].name}`,
          body: `${slowMovingProducts[0].name} has stock but no recent sales. Try a 10% discount or improve description.`,
          priority: "Smart",
        }
      : {
          title: "Keep momentum",
          body: "Most listed products are getting some movement. Continue monitoring price and stock.",
          priority: "Smart",
        },
    orderStats.cancelled > 0
      ? {
          title: "Review cancelled orders",
          body: `You have ${orderStats.cancelled} cancelled orders. Check delivery or product availability issues.`,
          priority: "Medium",
        }
      : {
          title: "Campaign timing",
          body: "Run campaigns around evening hours and weekends when shoppers are more likely to browse.",
          priority: "Medium",
        },
  ];

  const summary = [
    `Today you received ${todayOrders.length} orders.`,
    topProduct ? `Your top product is ${topProduct.name}.` : "No top product has emerged yet.",
    `${lowStockProducts.length} products are low in stock.`,
    `Repeat purchase rate is ${repeatPurchaseRate}%.`,
    slowMovingProducts[0]
      ? `Recommendation: Offer 10% discount on ${slowMovingProducts[0].name}.`
      : "Recommendation: Promote your top products to increase repeat sales.",
  ].join(" ");

  return {
    activeCategories,
    bestProducts,
    chartData,
    dailySales: todayOrders.reduce((sum, order) => sum + Number(order.sellerTotal || 0), 0),
    fastSellingItems,
    growth,
    lowPerformingProducts,
    lowStockProducts,
    monthlySales: monthlyOrders.reduce((sum, order) => sum + Number(order.sellerTotal || 0), 0),
    orderStats,
    recommendations,
    repeatPurchaseRate,
    slowMovingProducts,
    summary,
    totalCustomers: uniqueCustomers,
    weeklySales: weeklyRevenue,
    formatCurrency,
  };
};
