const { productsStore, reviewsStore } = require("../db/datastores");

const clampRating = (value) => Math.min(5, Math.max(1, Number(value || 0)));

const getReviewStats = async (productId) => {
  const reviews = await reviewsStore.find({ productId });
  const reviewCount = reviews.length;
  const rating = reviewCount
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  return {
    rating: Number(rating.toFixed(1)),
    reviewCount,
  };
};

const formatReview = (review = {}) => ({
  id: review._id,
  productId: review.productId,
  userId: review.userId,
  userName: review.userName || "Customer",
  rating: Number(review.rating || 0),
  comment: review.comment || "",
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const getProductReviews = async (req, res) => {
  const product = await productsStore.findOne({ _id: req.params.id });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const reviews = await reviewsStore.find({ productId: req.params.id }).sort({ createdAt: -1 });
  const stats = await getReviewStats(req.params.id);

  return res.json({
    reviews: reviews.map(formatReview),
    stats,
  });
};

const submitProductReview = async (req, res) => {
  const product = await productsStore.findOne({ _id: req.params.id });

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const rating = clampRating(req.body.rating);
  const comment = String(req.body.comment || "").trim();

  if (!rating || Number.isNaN(rating)) {
    return res.status(400).json({
      message: "Rating is required",
    });
  }

  if (!comment) {
    return res.status(400).json({
      message: "Review comment is required",
    });
  }

  const existingReview = await reviewsStore.findOne({
    productId: req.params.id,
    userId: req.user._id,
  });

  if (existingReview) {
    await reviewsStore.update(
      { _id: existingReview._id },
      {
        $set: {
          rating,
          comment,
          userName: req.user.name || "Customer",
        },
      },
      {}
    );
  } else {
    await reviewsStore.insert({
      productId: req.params.id,
      userId: req.user._id,
      userName: req.user.name || "Customer",
      rating,
      comment,
    });
  }

  const reviews = await reviewsStore.find({ productId: req.params.id }).sort({ createdAt: -1 });
  const stats = await getReviewStats(req.params.id);

  return res.status(existingReview ? 200 : 201).json({
    message: existingReview ? "Review updated successfully" : "Review submitted successfully",
    reviews: reviews.map(formatReview),
    stats,
  });
};

module.exports = {
  getProductReviews,
  getReviewStats,
  submitProductReview,
};
