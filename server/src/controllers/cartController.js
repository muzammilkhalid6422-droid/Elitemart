const { cartsStore, productsStore, sellersStore } = require("../db/datastores");

const buildCartResponse = async (userId) => {
  const cart = await cartsStore.findOne({ userId });

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      totalItems: 0,
    };
  }

  const items = await Promise.all(
    cart.items.map(async (item) => {
      const product = await productsStore.findOne({ _id: item.productId });

      if (!product) {
        return null;
      }

      const seller = product.sellerId
        ? await sellersStore.findOne({ _id: product.sellerId })
        : null;
      const sellerAccountNumber = String(seller?.paymentAccountNumber || "").trim();

      return {
        productId: product._id,
        quantity: item.quantity,
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          image: product.images?.[0] || "",
          category: product.category,
          shortDesc: product.shortDesc,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          sellerAccountNumber,
        },
      };
    })
  );

  const validItems = items.filter(Boolean);
  const subtotal = validItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const totalItems = validItems.reduce((total, item) => total + item.quantity, 0);

  const sellerAccounts = Array.from(
    validItems
      .reduce((map, item) => {
        const sellerId = item.product.sellerId || "";
        if (!sellerId || map.has(sellerId)) return map;

        map.set(sellerId, {
          sellerId,
          sellerName: item.product.sellerName || "Seller",
          accountNumber: item.product.sellerAccountNumber || "",
        });

        return map;
      }, new Map())
      .values()
  );

  return {
    items: validItems,
    sellerAccounts,
    subtotal,
    totalItems,
  };
};

const getCart = async (req, res) => {
  const cart = await buildCartResponse(req.user._id);
  res.json(cart);
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({
      message: "Product id is required",
    });
  }

  const product = await productsStore.findOne({ _id: productId });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  if (product.stock < quantity) {
    return res.status(400).json({
      message: "Requested quantity is not available",
    });
  }

  const existingCart = await cartsStore.findOne({ userId: req.user._id });
  const items = existingCart?.items || [];
  const existingItem = items.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    items.push({
      productId,
      quantity: Number(quantity),
    });
  }

  await cartsStore.update(
    { userId: req.user._id },
    {
      $set: {
        userId: req.user._id,
        items,
      },
    },
    { upsert: true }
  );

  return res.status(201).json({
    message: "Product added to cart",
    cart: await buildCartResponse(req.user._id),
  });
};

const updateCartItem = async (req, res) => {
  const quantity = Number(req.body.quantity);

  if (Number.isNaN(quantity) || quantity < 1) {
    return res.status(400).json({
      message: "Quantity must be at least 1",
    });
  }

  const cart = await cartsStore.findOne({ userId: req.user._id });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const items = cart.items.map((item) =>
    item.productId === req.params.productId
      ? { ...item, quantity }
      : item
  );

  await cartsStore.update(
    { _id: cart._id },
    { $set: { items } },
    {}
  );

  return res.json({
    message: "Cart updated",
    cart: await buildCartResponse(req.user._id),
  });
};

const removeCartItem = async (req, res) => {
  const cart = await cartsStore.findOne({ userId: req.user._id });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const items = cart.items.filter(
    (item) => item.productId !== req.params.productId
  );

  await cartsStore.update(
    { _id: cart._id },
    { $set: { items } },
    {}
  );

  return res.json({
    message: "Item removed from cart",
    cart: await buildCartResponse(req.user._id),
  });
};

module.exports = {
  buildCartResponse,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
