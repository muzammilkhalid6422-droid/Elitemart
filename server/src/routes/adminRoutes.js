const express = require("express");

const {
  adminLogin,
  getAdminProfile,
} = require("../controllers/adminAuthController");
const {
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
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  approvePaymentRequest,
  getPaymentRequests,
  rejectPaymentRequest,
} = require("../controllers/paymentRequestController");
const {
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/settingsController");

const router = express.Router();

// Auth routes (no protection needed)
router.post("/auth/login", adminLogin);
router.get("/auth/profile", protect, adminOnly, getAdminProfile);

// Admin records (protected)
router.get("/overview", protect, adminOnly, getAdminOverview);
router.get("/settings", protect, adminOnly, getAdminSettings);
router.put("/settings", protect, adminOnly, updateAdminSettings);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/products", protect, adminOnly, getAllProducts);
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/payment-requests", protect, adminOnly, getPaymentRequests);
router.put("/payment-requests/:id/approve", protect, adminOnly, approvePaymentRequest);
router.put("/payment-requests/:id/reject", protect, adminOnly, rejectPaymentRequest);

// Seller management routes (protected)
router.get("/sellers/history", protect, adminOnly, getSellerHistory);
router.get("/sellers/premium", protect, adminOnly, getPaidSellers);
router.get("/sellers", protect, adminOnly, getAllSellers);
router.get("/sellers/approved", protect, adminOnly, getApprovedSellers);
router.get("/sellers/:id", protect, adminOnly, getSeller);
router.put("/sellers/:id/approve", protect, adminOnly, approveSeller);
router.put("/sellers/:id/upgrade", protect, adminOnly, upgradeSeller);
router.put("/sellers/:id/extend-plan", protect, adminOnly, extendSellerPlan);
router.put("/sellers/:id/downgrade", protect, adminOnly, downgradeSeller);
router.delete("/sellers/:id/reject", protect, adminOnly, rejectSeller);

module.exports = router;
