const express = require("express");

const {
  registerUser,
  registerSeller,
  requestRegistrationOtp,
  loginUser,
  loginWithGoogle,
  getProfile,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register/user", registerUser);
router.post("/register/seller", registerSeller);
router.post("/register/request-otp", requestRegistrationOtp);
router.post("/login", loginUser);
router.post("/google", loginWithGoogle);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
