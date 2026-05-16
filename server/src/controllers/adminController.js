const {
  ordersStore,
  productsStore,
  sellersStore,
  usersStore,
} = require("../db/datastores");
const {
  applyAutoComplete,
  formatOrder: formatTrackedOrder,
} = require("./orderController");
const {
  addMonths,
  getRemainingDays,
  hasPremiumPlan,
  isPlanExpired,
  normalizeSellerPlan,
} = require("../utils/planUtils");
const { buildTrafficSummary } = require("./trafficController");
const { sendSellerApprovedEmail } = require("../utils/emailService");

const sanitizeSeller = (seller) => {
  const { password, ...safeSeller } = seller;
  return {
    ...safeSeller,
    id: seller._id,
  };
};

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    role: "user",
  };
};

const formatProduct = (product) => ({
  id: product._id,
  name: product.name,
  category: product.category,
  price: Number(product.price || 0),
  stock: Number(product.stock || 0),
  brand: product.brand || "",
  sku: product.sku || "",
  image: product.images?.[0] || "",
  sellerId: product.sellerId || "",
  sellerName: product.sellerName || "",
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const getAdminOverview = async (_req, res) => {
  try {
    const [users, pendingSellers, approvedSellers, allSellers, products, orders, traffic] =
      await Promise.all([
        usersStore.find({}).sort({ createdAt: -1 }),
        sellersStore.find({ isApproved: false }).sort({ createdAt: -1 }),
        sellersStore.find({ isApproved: true }).sort({ createdAt: -1 }),
        sellersStore.find({}).sort({ createdAt: -1 }),
        productsStore.find({}).sort({ createdAt: -1 }),
        ordersStore.find({}).sort({ createdAt: -1 }),
        buildTrafficSummary(),
      ]);

    const normalizedOrders = await Promise.all(orders.map(applyAutoComplete));
    const revenue = normalizedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    return res.json({
      stats: {
        totalUsers: users.length,
        totalSellers: allSellers.length,
        approvedSellers: approvedSellers.length,
        pendingSellers: pendingSellers.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: revenue,
      },
      users: users.map(sanitizeUser),
      sellers: allSellers.map(sanitizeSeller),
      pendingSellers: pendingSellers.map(sanitizeSeller),
      approvedSellers: approvedSellers.map(sanitizeSeller),
      products: products.map(formatProduct),
      orders: normalizedOrders.map(formatTrackedOrder),
      traffic,
    });
  } catch (error) {
    console.error("Get admin overview error:", error);
    return res.status(500).json({
      message: "Unable to fetch admin overview",
    });
  }
};

const getSellerHistory = async (_req, res) => {
  try {
    const sellers = await sellersStore.find({}).sort({ createdAt: -1 });

    return res.json({
      sellers: sellers.map(sanitizeSeller),
    });
  } catch (error) {
    console.error("Get seller history error:", error);
    return res.status(500).json({
      message: "Unable to fetch seller history",
    });
  }
};

const getAllUsers = async (_req, res) => {
  try {
    const users = await usersStore.find({}).sort({ createdAt: -1 });

    return res.json({
      users: users.map(sanitizeUser),
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      message: "Unable to fetch users",
    });
  }
};

const getAllProducts = async (_req, res) => {
  try {
    const products = await productsStore.find({}).sort({ createdAt: -1 });

    return res.json({
      products: products.map(formatProduct),
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      message: "Unable to fetch products",
    });
  }
};

const getAllOrders = async (_req, res) => {
  try {
    const orders = await ordersStore.find({}).sort({ createdAt: -1 });
    const normalizedOrders = await Promise.all(orders.map(applyAutoComplete));

    return res.json({
      orders: normalizedOrders.map(formatTrackedOrder),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      message: "Unable to fetch orders",
    });
  }
};

const getAllSellers = async (req, res) => {
  try {
    const sellers = await sellersStore.find({ isApproved: false });

    return res.json({
      sellers: sellers.map(sanitizeSeller),
    });
  } catch (error) {
    console.error("Get sellers error:", error);
    return res.status(500).json({
      message: "Unable to fetch sellers",
    });
  }
};

const getApprovedSellers = async (req, res) => {
  try {
    const sellers = await sellersStore.find({ isApproved: true });

    return res.json({
      sellers: sellers.map(sanitizeSeller),
    });
  } catch (error) {
    console.error("Get approved sellers error:", error);
    return res.status(500).json({
      message: "Unable to fetch approved sellers",
    });
  }
};

const getSeller = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Seller ID is required",
      });
    }

    const seller = await sellersStore.findOne({ _id: id });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    return res.json({
      seller: sanitizeSeller(seller),
    });
  } catch (error) {
    console.error("Get seller error:", error);
    return res.status(500).json({
      message: "Unable to fetch seller",
    });
  }
};

const approveSeller = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Seller ID is required",
      });
    }

    const seller = await sellersStore.findOne({ _id: id });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    await sellersStore.update(
      { _id: id },
      { $set: { isApproved: true } },
      {}
    );

    const updatedSeller = await sellersStore.findOne({ _id: id });
    sendSellerApprovedEmail(updatedSeller);

    return res.json({
      message: "Seller approved successfully",
      seller: sanitizeSeller(updatedSeller),
    });
  } catch (error) {
    console.error("Approve seller error:", error);
    return res.status(500).json({
      message: "Unable to approve seller",
    });
  }
};

const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Seller ID is required",
      });
    }

    const seller = await sellersStore.findOne({ _id: id });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    await sellersStore.remove({ _id: id }, {});

    return res.json({
      message: "Seller rejected and removed successfully",
    });
  } catch (error) {
    console.error("Reject seller error:", error);
    return res.status(500).json({
      message: "Unable to reject seller",
    });
  }
};

const formatPaidSeller = (seller) => {
  const normalized = normalizeSellerPlan(seller);
  const remainingDays = getRemainingDays(normalized.planExpiry);

  return {
    ...sanitizeSeller(normalized),
    remainingDays,
    status: isPlanExpired(normalized.planExpiry) ? "Expired" : "Active",
  };
};

const getPaidSellers = async (_req, res) => {
  try {
    const sellers = await sellersStore.find({ plan: "premium" }).sort({ planExpiry: 1 });
    const activeSellers = sellers.filter(hasPremiumPlan);

    return res.json({
      sellers: activeSellers.map(formatPaidSeller),
    });
  } catch (error) {
    console.error("Get paid sellers error:", error);
    return res.status(500).json({
      message: "Unable to fetch paid sellers",
    });
  }
};

const upgradeSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMonths = 3 } = req.body || {};
    const seller = await sellersStore.findOne({ _id: id });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    const now = new Date().toISOString();
    const planExpiry = addMonths(now, durationMonths);

    await sellersStore.update(
      { _id: id },
      {
        $set: {
          plan: "premium",
          planStartDate: now,
          planExpiry,
        },
      },
      {}
    );

    const updatedSeller = await sellersStore.findOne({ _id: id });

    return res.json({
      message: "Seller upgraded to premium",
      seller: formatPaidSeller(updatedSeller),
    });
  } catch (error) {
    console.error("Upgrade seller error:", error);
    return res.status(500).json({
      message: "Unable to upgrade seller",
    });
  }
};

const extendSellerPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMonths = 3 } = req.body || {};
    const seller = await sellersStore.findOne({ _id: id });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    const normalized = normalizeSellerPlan(seller);
    const baseDate = hasPremiumPlan(normalized) ? normalized.planExpiry : new Date().toISOString();
    const planExpiry = addMonths(baseDate, durationMonths);
    const planStartDate = normalized.planStartDate || new Date().toISOString();

    await sellersStore.update(
      { _id: id },
      {
        $set: {
          plan: "premium",
          planStartDate,
          planExpiry,
        },
      },
      {}
    );

    const updatedSeller = await sellersStore.findOne({ _id: id });

    return res.json({
      message: "Seller plan extended",
      seller: formatPaidSeller(updatedSeller),
    });
  } catch (error) {
    console.error("Extend seller plan error:", error);
    return res.status(500).json({
      message: "Unable to extend seller plan",
    });
  }
};

const downgradeSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await sellersStore.findOne({ _id: id });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    await sellersStore.update(
      { _id: id },
      {
        $set: {
          plan: "free",
          planStartDate: null,
          planExpiry: null,
        },
      },
      {}
    );

    const updatedSeller = await sellersStore.findOne({ _id: id });

    return res.json({
      message: "Seller downgraded to free plan",
      seller: sanitizeSeller(updatedSeller),
    });
  } catch (error) {
    console.error("Downgrade seller error:", error);
    return res.status(500).json({
      message: "Unable to downgrade seller",
    });
  }
};

module.exports = {
  getAdminOverview,
  getAllUsers,
  getAllProducts,
  getAllOrders,
  getSellerHistory,
  getAllSellers,
  getApprovedSellers,
  getSeller,
  approveSeller,
  rejectSeller,
  getPaidSellers,
  upgradeSeller,
  extendSellerPlan,
  downgradeSeller,
};
