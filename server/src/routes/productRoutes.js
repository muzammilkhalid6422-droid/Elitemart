const express = require("express");

const {
  listProducts,
  getProductById,
  listSellerProducts,
  createProduct,
  deleteProduct,
} = require("../controllers/productController");
const {
  getProductReviews,
  submitProductReview,
} = require("../controllers/reviewController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", listProducts);
router.get("/seller/my-products", protect, allowRoles("seller"), listSellerProducts);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, allowRoles("user"), submitProductReview);
router.get("/:id", getProductById);
router.post("/", protect, allowRoles("seller"), createProduct);
router.delete("/:id", protect, allowRoles("seller"), deleteProduct);

module.exports = router;
