const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  getSellerProfile,
  updateSellerProfile,
} = require("../controllers/sellerController");
const {
  getMyPaymentRequests,
  submitPaymentRequest,
} = require("../controllers/paymentRequestController");
const { getMarketTrends } = require("../controllers/marketTrendController");

const router = express.Router();

router.get("/profile", protect, allowRoles("seller"), getSellerProfile);
router.put("/profile", protect, allowRoles("seller"), updateSellerProfile);
router.get("/payment-requests", protect, allowRoles("seller"), getMyPaymentRequests);
router.post("/payment-requests", protect, allowRoles("seller"), submitPaymentRequest);
router.get("/market-trends", protect, allowRoles("seller"), getMarketTrends);

module.exports = router;
