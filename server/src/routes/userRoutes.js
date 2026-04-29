const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");
const {
  getFavorites,
  removeFavorite,
  toggleFavorite,
} = require("../controllers/favoriteController");

const router = express.Router();

router.get("/profile", protect, allowRoles("user"), getUserProfile);
router.put("/profile", protect, allowRoles("user"), updateUserProfile);
router.get("/favorites", protect, allowRoles("user"), getFavorites);
router.post("/favorites", protect, allowRoles("user"), toggleFavorite);
router.delete("/favorites/:productId", protect, allowRoles("user"), removeFavorite);

module.exports = router;
