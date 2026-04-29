const { productsStore } = require("../db/datastores");
const { getReviewStats } = require("./reviewController");

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

const getBase64SizeBytes = (image = "") => {
  const parts = String(image).split(",");
  const base64 = parts[1] || parts[0] || "";
  const padding = (base64.match(/=*$/) || [""])[0].length;

  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const formatProduct = async (product) => {
  const reviewStats = await getReviewStats(product._id);

  return {
    id: product._id,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    brand: product.brand,
    sku: product.sku,
    shortDesc: product.shortDesc,
    description: product.description,
    featured: Boolean(product.featured),
    image: product.images?.[0] || "",
    images: product.images || [],
    rating: reviewStats.rating,
    reviewCount: reviewStats.reviewCount,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const listProducts = async (_req, res) => {
  const products = await productsStore.find({}).sort({ createdAt: -1 });

  res.json({
    products: await Promise.all(products.map(formatProduct)),
  });
};

const getProductById = async (req, res) => {
  const product = await productsStore.findOne({ _id: req.params.id });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  return res.json({
    product: await formatProduct(product),
  });
};

const listSellerProducts = async (req, res) => {
  const products = await productsStore
    .find({ sellerId: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    products: await Promise.all(products.map(formatProduct)),
  });
};

const createProduct = async (req, res) => {
  const {
    name,
    category,
    price,
    stock,
    brand,
    sku,
    shortDesc,
    description,
    featured = false,
    images = [],
  } = req.body;

  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({
      message: "Name, category, price, and stock are required",
    });
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStock)) {
    return res.status(400).json({
      message: "Price and stock must be valid numbers",
    });
  }

  const normalizedImages = Array.isArray(images)
    ? images.filter(Boolean)
    : [];

  if (normalizedImages.length > MAX_IMAGES) {
    return res.status(400).json({
      message: `You can upload up to ${MAX_IMAGES} images only`,
    });
  }

  const oversizedImage = normalizedImages.find(
    (image) => getBase64SizeBytes(image) > MAX_IMAGE_SIZE_BYTES
  );

  if (oversizedImage) {
    return res.status(400).json({
      message: "Image cannot be uploaded because file size is larger than 5 MB",
    });
  }

  const product = await productsStore.insert({
    name: String(name).trim(),
    category: String(category).trim(),
    price: parsedPrice,
    stock: parsedStock,
    brand: String(brand || "").trim(),
    sku: String(sku || "").trim(),
    shortDesc: String(shortDesc || "").trim(),
    description: String(description || shortDesc || "").trim(),
    featured: Boolean(featured),
    images: normalizedImages,
    sellerId: req.user._id,
    sellerName: req.user.name,
  });

  return res.status(201).json({
    message: "Product created successfully",
    product: await formatProduct(product),
  });
};

const deleteProduct = async (req, res) => {
  const product = await productsStore.findOne({ _id: req.params.id });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  if (product.sellerId !== req.user._id) {
    return res.status(403).json({
      message: "You can only delete your own products",
    });
  }

  await productsStore.remove({ _id: product._id }, {});

  return res.json({
    message: "Product deleted successfully",
  });
};

module.exports = {
  listProducts,
  getProductById,
  listSellerProducts,
  createProduct,
  deleteProduct,
};
