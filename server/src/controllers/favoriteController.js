const { favoritesStore, productsStore } = require("../db/datastores");
const { getReviewStats } = require("./reviewController");

const formatFavoriteProduct = async (product) => {
  const stats = await getReviewStats(product._id);

  return {
    id: product._id,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    brand: product.brand,
    shortDesc: product.shortDesc,
    description: product.description,
    image: product.images?.[0] || "",
    images: product.images || [],
    rating: stats.rating,
    reviewCount: stats.reviewCount,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
  };
};

const getFavoriteDoc = async (userId) => {
  const favorite = await favoritesStore.findOne({ userId });

  return favorite || {
    userId,
    productIds: [],
  };
};

const getFavorites = async (req, res) => {
  const favorite = await getFavoriteDoc(req.user._id);
  const products = await Promise.all(
    (favorite.productIds || []).map((productId) => productsStore.findOne({ _id: productId }))
  );

  return res.json({
    productIds: favorite.productIds || [],
    products: await Promise.all(products.filter(Boolean).map(formatFavoriteProduct)),
  });
};

const toggleFavorite = async (req, res) => {
  const { productId } = req.body;

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

  const favorite = await getFavoriteDoc(req.user._id);
  const productIds = favorite.productIds || [];
  const isFavorite = productIds.includes(productId);
  const nextProductIds = isFavorite
    ? productIds.filter((id) => id !== productId)
    : [productId, ...productIds];

  await favoritesStore.update(
    { userId: req.user._id },
    { $set: { userId: req.user._id, productIds: nextProductIds } },
    { upsert: true }
  );

  return res.json({
    message: isFavorite ? "Product removed from favourites" : "Product added to favourites",
    isFavorite: !isFavorite,
    productIds: nextProductIds,
  });
};

const removeFavorite = async (req, res) => {
  const favorite = await getFavoriteDoc(req.user._id);
  const nextProductIds = (favorite.productIds || []).filter(
    (productId) => productId !== req.params.productId
  );

  await favoritesStore.update(
    { userId: req.user._id },
    { $set: { userId: req.user._id, productIds: nextProductIds } },
    { upsert: true }
  );

  return res.json({
    message: "Product removed from favourites",
    productIds: nextProductIds,
  });
};

module.exports = {
  getFavorites,
  toggleFavorite,
  removeFavorite,
};
