const express = require("express");

const {
  placeOrder,
  getMyOrders,
  getSellerOrders,
  getAllOrders,
  updateSubOrderStatus,
  markSubOrderReceived,
} = require("../controllers/orderController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", placeOrder);
router.get("/my-orders", getMyOrders);
router.get("/seller", allowRoles("seller", "admin"), getSellerOrders);
router.get("/admin/all", allowRoles("admin"), getAllOrders);
router.patch(
  "/:orderId/sub-orders/:subOrderId/status",
  allowRoles("seller", "admin"),
  updateSubOrderStatus
);
router.patch(
  "/:orderId/sub-orders/:subOrderId/received",
  allowRoles("user"),
  markSubOrderReceived
);

module.exports = router;
