const { cartsStore, ordersStore, productsStore, sellersStore } = require("../db/datastores");
const { buildCartResponse } = require("./cartController");

const SELLER_STATUSES = ["Confirmed", "Shipped", "Out for Delivery", "Delivered"];
const ADMIN_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Completed",
  "Cancelled",
];
const TRACKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Completed",
];
const AUTO_COMPLETE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

const buildOrderNumber = () =>
  `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

const buildSubOrderId = (sellerId = "") =>
  `SUB-${Date.now().toString().slice(-8)}-${String(sellerId).slice(-5)}-${Math.floor(
    Math.random() * 900 + 100
  )}`;

const nowIso = () => new Date().toISOString();

const formatAddress = (shippingAddress = {}) =>
  [
    shippingAddress.address,
    shippingAddress.city,
    shippingAddress.region,
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join(", ");

const getSubOrderStatus = (subOrder = {}) => subOrder.status || "Pending";

const buildTrackingSteps = (status = "Pending", actor = "system") => [
  {
    status,
    timestamp: nowIso(),
    actor,
  },
];

const appendTrackingStep = (subOrder, status, actor) => {
  const trackingSteps = Array.isArray(subOrder.trackingSteps)
    ? subOrder.trackingSteps
    : buildTrackingSteps(getSubOrderStatus(subOrder));
  const lastStep = trackingSteps[trackingSteps.length - 1];

  if (lastStep?.status === status) {
    return trackingSteps;
  }

  return [
    ...trackingSteps,
    {
      status,
      timestamp: nowIso(),
      actor,
    },
  ];
};

const getAggregateStatus = (subOrders = []) => {
  if (!subOrders.length) return "Pending";
  const statuses = subOrders.map(getSubOrderStatus);

  if (statuses.every((status) => status === "Completed")) return "Completed";
  if (statuses.some((status) => status === "Cancelled")) return "Cancelled";
  if (statuses.every((status) => status === "Delivered" || status === "Completed")) {
    return "Delivered";
  }

  for (let i = TRACKING_STATUSES.length - 1; i >= 0; i -= 1) {
    if (statuses.includes(TRACKING_STATUSES[i])) {
      return TRACKING_STATUSES[i];
    }
  }

  return "Pending";
};

const buildSubOrdersFromItems = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const sellerId = item.sellerId || "unknown-seller";
    const existing = groups.get(sellerId) || {
      id: item.subOrderId || buildSubOrderId(sellerId),
      sellerId,
      sellerName: item.sellerName || "Seller",
      sellerAccountNumber: item.sellerAccountNumber || "",
      status: item.status || "Pending",
      trackingSteps: item.trackingSteps || buildTrackingSteps("Pending"),
      deliveredAt: item.deliveredAt || null,
      completedAt: item.completedAt || null,
      items: [],
      totalItems: 0,
      subtotal: 0,
    };

    existing.items.push(item);
    existing.totalItems += Number(item.quantity || 0);
    existing.subtotal += Number(item.lineTotal || 0);
    groups.set(sellerId, existing);
  });

  return Array.from(groups.values());
};

const normalizeSubOrders = (order = {}) => {
  const existingSubOrders = Array.isArray(order.subOrders) && order.subOrders.length
    ? order.subOrders
    : buildSubOrdersFromItems(order.items || []);

  return existingSubOrders.map((subOrder) => {
    const items = subOrder.items || [];
    const status = subOrder.status || order.status || "Pending";

    return {
      ...subOrder,
      id: subOrder.id || buildSubOrderId(subOrder.sellerId),
      status,
      trackingSteps: Array.isArray(subOrder.trackingSteps) && subOrder.trackingSteps.length
        ? subOrder.trackingSteps
        : buildTrackingSteps(status),
      deliveredAt: subOrder.deliveredAt || null,
      completedAt: subOrder.completedAt || null,
      totalItems: subOrder.totalItems || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      subtotal: subOrder.subtotal || items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
      items,
    };
  });
};

const applyAutoComplete = async (order) => {
  const subOrders = normalizeSubOrders(order);
  let changed = false;
  const currentTime = Date.now();

  const nextSubOrders = subOrders.map((subOrder) => {
    if (subOrder.status !== "Delivered" || !subOrder.deliveredAt) {
      return subOrder;
    }

    const deliveredTime = new Date(subOrder.deliveredAt).getTime();

    if (Number.isNaN(deliveredTime) || currentTime - deliveredTime < AUTO_COMPLETE_AFTER_MS) {
      return subOrder;
    }

    changed = true;
    return {
      ...subOrder,
      status: "Completed",
      completedAt: nowIso(),
      trackingSteps: appendTrackingStep(subOrder, "Completed", "system"),
    };
  });

  if (!changed) {
    return {
      ...order,
      subOrders,
      status: getAggregateStatus(subOrders),
    };
  }

  const status = getAggregateStatus(nextSubOrders);
  await ordersStore.update(
    { _id: order._id },
    { $set: { subOrders: nextSubOrders, status } },
    {}
  );

  return {
    ...order,
    subOrders: nextSubOrders,
    status,
  };
};

const formatOrder = (order) => {
  const subOrders = normalizeSubOrders(order);
  const items = subOrders.flatMap((subOrder) =>
    (subOrder.items || []).map((item) => ({
      ...item,
      subOrderId: subOrder.id,
      subOrderStatus: subOrder.status,
    }))
  );

  return {
    id: order._id,
    orderNumber: order.orderNumber,
    customer: {
      id: order.userId,
      name: order.customerName,
      email: order.customerEmail,
    },
    shippingAddress: order.shippingAddress,
    location: formatAddress(order.shippingAddress),
    phone: order.phone,
    status: getAggregateStatus(subOrders),
    paymentMethod: order.paymentMethod,
    paymentProof: order.paymentProof || null,
    items,
    subOrders,
    totalItems: order.totalItems,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const findOrderAndSubOrder = async (orderId, subOrderId) => {
  const order = await ordersStore.findOne({ _id: orderId });

  if (!order) {
    return { order: null, subOrder: null, subOrders: [] };
  }

  const orderWithAutoComplete = await applyAutoComplete(order);
  const subOrders = normalizeSubOrders(orderWithAutoComplete);
  const subOrder = subOrders.find((item) => item.id === subOrderId);

  return { order: orderWithAutoComplete, subOrder, subOrders };
};

const deductStockForItems = async (items = []) => {
  const quantityByProduct = items.reduce((map, item) => {
    map.set(item.productId, (map.get(item.productId) || 0) + Number(item.quantity || 0));
    return map;
  }, new Map());

  for (const [productId, quantity] of quantityByProduct.entries()) {
    const product = await productsStore.findOne({ _id: productId });

    if (!product) {
      throw new Error("Product not found while updating stock");
    }

    if (Number(product.stock || 0) < quantity) {
      throw new Error(`${product.name} has only ${product.stock} items left`);
    }

    await productsStore.update(
      { _id: productId },
      { $set: { stock: Number(product.stock || 0) - quantity } },
      {}
    );
  }
};

const placeOrder = async (req, res) => {
  const {
    shippingAddress = {},
    phone = "",
    paymentMethod = "Cash on Delivery",
    paymentProof = null,
  } = req.body;

  const requiredFields = [
    shippingAddress.firstName,
    shippingAddress.lastName,
    shippingAddress.address,
    shippingAddress.city,
    phone,
  ];

  if (requiredFields.some((field) => !String(field || "").trim())) {
    return res.status(400).json({
      message: "Shipping information is incomplete",
    });
  }

  const cart = await buildCartResponse(req.user._id);

  if (!cart.items.length) {
    return res.status(400).json({
      message: "Cart is empty",
    });
  }

  const normalizedPaymentMethod = String(paymentMethod || "Cash on Delivery").trim();
  const requiresPaymentProof = normalizedPaymentMethod !== "Cash on Delivery";

  if (requiresPaymentProof) {
    const requiredProofFields = [
      paymentProof?.amount,
      paymentProof?.screenshot,
      paymentProof?.transactionId,
      paymentProof?.accountName,
    ];

    if (requiredProofFields.some((field) => !String(field || "").trim())) {
      return res.status(400).json({
        message: "Payment proof is required before placing this order",
      });
    }
  }

  const items = [];
  const sellerAccountsById = new Map();

  for (const cartItem of cart.items) {
    const product = await productsStore.findOne({ _id: cartItem.productId });

    if (!product) {
      return res.status(404).json({
        message: `Product not found for item ${cartItem.product?.name || ""}`.trim(),
      });
    }

    if (product.stock < cartItem.quantity) {
      return res.status(400).json({
        message: `${product.name} has only ${product.stock} items left`,
      });
    }

    const seller = product.sellerId
      ? await sellersStore.findOne({ _id: product.sellerId })
      : null;
    const sellerAccountNumber = String(seller?.paymentAccountNumber || "").trim();

    if (product.sellerId && !sellerAccountsById.has(product.sellerId)) {
      sellerAccountsById.set(product.sellerId, {
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        accountNumber: sellerAccountNumber,
      });
    }

    items.push({
      productId: product._id,
      productName: product.name,
      image: product.images?.[0] || "",
      category: product.category,
      price: product.price,
      quantity: cartItem.quantity,
      lineTotal: product.price * cartItem.quantity,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      sellerAccountNumber,
    });
  }

  let normalizedPaymentProof = null;

  if (requiresPaymentProof) {
    const sellerAccounts = Array.from(sellerAccountsById.values()).filter(
      (account) => account.accountNumber
    );
    const selectedSellerId =
      String(paymentProof?.selectedSellerId || "").trim() ||
      (sellerAccounts.length === 1 ? sellerAccounts[0].sellerId : "");
    const selectedAccount = sellerAccounts.find(
      (account) => account.sellerId === selectedSellerId
    );

    if (!selectedAccount) {
      return res.status(400).json({
        message: "Please select the product seller account for payment",
      });
    }

    normalizedPaymentProof = {
      amount: Number(paymentProof.amount),
      screenshot: String(paymentProof.screenshot || "").trim(),
      transactionId: String(paymentProof.transactionId || "").trim(),
      accountName: String(paymentProof.accountName || "").trim(),
      selectedSellerId: selectedAccount.sellerId,
      sellerName: selectedAccount.sellerName || "Seller",
      accountNumber: selectedAccount.accountNumber,
      submittedAt: nowIso(),
    };
  }

  try {
    await deductStockForItems(items);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Unable to update product stock",
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = 0;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subOrders = buildSubOrdersFromItems(items);

  const order = await ordersStore.insert({
    orderNumber: buildOrderNumber(),
    userId: req.user._id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    shippingAddress: {
      firstName: String(shippingAddress.firstName).trim(),
      lastName: String(shippingAddress.lastName).trim(),
      address: String(shippingAddress.address).trim(),
      city: String(shippingAddress.city).trim(),
      region: String(shippingAddress.region || "").trim(),
      country: String(shippingAddress.country || "Pakistan").trim(),
    },
    phone: String(phone).trim(),
    paymentMethod: normalizedPaymentMethod,
    paymentProof: normalizedPaymentProof,
    status: "Pending",
    items,
    subOrders,
    totalItems,
    subtotal,
    shippingFee,
    totalAmount: subtotal + shippingFee,
    stockDeducted: true,
    stockDeductedAt: nowIso(),
  });

  await cartsStore.update(
    { userId: req.user._id },
    { $set: { userId: req.user._id, items: [] } },
    { upsert: true }
  );

  return res.status(201).json({
    message: "Order placed successfully",
    order: formatOrder(order),
  });
};

const getMyOrders = async (req, res) => {
  const orders = await ordersStore.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const normalized = await Promise.all(orders.map(applyAutoComplete));

  return res.json({
    orders: normalized.map(formatOrder),
  });
};

const getSellerOrders = async (req, res) => {
  const orders = await ordersStore.find({}).sort({ createdAt: -1 });
  const normalized = await Promise.all(orders.map(applyAutoComplete));

  const sellerOrders = normalized
    .map((order) => {
      const sellerSubOrders = normalizeSubOrders(order).filter(
        (subOrder) => subOrder.sellerId === req.user._id
      );

      if (!sellerSubOrders.length) {
        return null;
      }

      const sellerItems = sellerSubOrders.flatMap((subOrder) => subOrder.items || []);
      const sellerTotal = sellerSubOrders.reduce(
        (sum, subOrder) => sum + Number(subOrder.subtotal || 0),
        0
      );
      const sellerQuantity = sellerSubOrders.reduce(
        (sum, subOrder) => sum + Number(subOrder.totalItems || 0),
        0
      );

      return {
        ...formatOrder(order),
        sellerSubOrders,
        sellerItems,
        sellerTotal,
        sellerQuantity,
      };
    })
    .filter(Boolean);

  return res.json({
    orders: sellerOrders,
  });
};

const getAllOrders = async (_req, res) => {
  const orders = await ordersStore.find({}).sort({ createdAt: -1 });
  const normalized = await Promise.all(orders.map(applyAutoComplete));

  return res.json({
    orders: normalized.map(formatOrder),
  });
};

const updateSubOrderStatus = async (req, res) => {
  const { orderId, subOrderId } = req.params;
  const { status } = req.body;

  if (!ADMIN_STATUSES.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }

  const { order, subOrder, subOrders } = await findOrderAndSubOrder(orderId, subOrderId);

  if (!order || !subOrder) {
    return res.status(404).json({
      message: "Order or seller sub-order not found",
    });
  }

  const isAdmin = req.userRole === "admin";
  const isSellerOwner = req.userRole === "seller" && subOrder.sellerId === req.user._id;

  if (!isAdmin && !isSellerOwner) {
    return res.status(403).json({
      message: "You can only update your own seller order",
    });
  }

  if (!isAdmin && !SELLER_STATUSES.includes(status)) {
    return res.status(403).json({
      message: "Seller can only confirm, ship, dispatch or deliver orders",
    });
  }

  const nextSubOrders = subOrders.map((item) => {
    if (item.id !== subOrderId) return item;

    return {
      ...item,
      status,
      deliveredAt: status === "Delivered" ? nowIso() : item.deliveredAt || null,
      completedAt: status === "Completed" ? nowIso() : item.completedAt || null,
      trackingSteps: appendTrackingStep(item, status, isAdmin ? "admin" : "seller"),
    };
  });
  const aggregateStatus = getAggregateStatus(nextSubOrders);

  await ordersStore.update(
    { _id: order._id },
    { $set: { subOrders: nextSubOrders, status: aggregateStatus } },
    {}
  );

  const updated = await ordersStore.findOne({ _id: order._id });

  return res.json({
    message: "Order status updated",
    order: formatOrder(updated),
  });
};

const markSubOrderReceived = async (req, res) => {
  const { orderId, subOrderId } = req.params;
  const { order, subOrder, subOrders } = await findOrderAndSubOrder(orderId, subOrderId);

  if (!order || !subOrder) {
    return res.status(404).json({
      message: "Order or seller sub-order not found",
    });
  }

  if (order.userId !== req.user._id) {
    return res.status(403).json({
      message: "You can only complete your own orders",
    });
  }

  if (subOrder.status !== "Delivered") {
    return res.status(400).json({
      message: "Only delivered orders can be marked as received",
    });
  }

  const nextSubOrders = subOrders.map((item) => {
    if (item.id !== subOrderId) return item;

    return {
      ...item,
      status: "Completed",
      completedAt: nowIso(),
      trackingSteps: appendTrackingStep(item, "Completed", "user"),
    };
  });
  const aggregateStatus = getAggregateStatus(nextSubOrders);

  await ordersStore.update(
    { _id: order._id },
    { $set: { subOrders: nextSubOrders, status: aggregateStatus } },
    {}
  );

  const updated = await ordersStore.findOne({ _id: order._id });

  return res.json({
    message: "Order marked as received",
    order: formatOrder(updated),
  });
};

module.exports = {
  placeOrder,
  getMyOrders,
  getSellerOrders,
  getAllOrders,
  updateSubOrderStatus,
  markSubOrderReceived,
  formatOrder,
  applyAutoComplete,
};
