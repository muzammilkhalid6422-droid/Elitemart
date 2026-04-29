const jwt = require("jsonwebtoken");

const { usersStore, sellersStore } = require("../db/datastores");
const { isPlanExpired, normalizeSellerPlan } = require("../utils/planUtils");

const getTokenFromHeader = (headerValue = "") => {
  if (!headerValue.startsWith("Bearer ")) {
    return null;
  }

  return headerValue.slice(7);
};

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "development-secret"
    );

    // Handle admin authentication
    if (decoded.role === "admin" && decoded.id === "admin_user") {
      req.user = { _id: "admin_user" };
      req.userRole = "admin";
      req.userStore = "admin";
      return next();
    }

    let user;
    let store;

    if (decoded.role === "seller") {
      user = await sellersStore.findOne({ _id: decoded.id });
      store = "seller";
    } else {
      user = await usersStore.findOne({ _id: decoded.id });
      store = "user";
    }

    if (!user) {
      return res.status(401).json({
        message: "User not found for this token",
      });
    }

    if (decoded.role === "seller") {
      const normalizedSeller = normalizeSellerPlan(user);

      if (
        normalizedSeller.isPremium &&
        isPlanExpired(normalizedSeller.subscriptionEndDate || normalizedSeller.planExpiry)
      ) {
        await sellersStore.update(
          { _id: normalizedSeller._id },
          {
            $set: {
              plan: "free",
              isPremium: false,
              subscriptionStatus: "expired",
              subscriptionStartDate: null,
              subscriptionEndDate: normalizedSeller.subscriptionEndDate || normalizedSeller.planExpiry,
              planStartDate: null,
              planExpiry: null,
            },
          },
          {}
        );

        user = {
          ...normalizedSeller,
          plan: "free",
          isPremium: false,
          subscriptionStatus: "expired",
          subscriptionStartDate: null,
          subscriptionEndDate: normalizedSeller.subscriptionEndDate || normalizedSeller.planExpiry,
          planStartDate: null,
          planExpiry: null,
        };
      } else {
        user = normalizedSeller;
      }
    }

    if (decoded.role === "seller" && !user.isApproved) {
      return res.status(403).json({
        message: "Your seller account is pending admin approval",
      });
    }

    req.user = user;
    req.userRole = decoded.role;
    req.userStore = store;
    next();
  } catch (_error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return res.status(403).json({
      message: "You do not have permission for this action",
    });
  }

  next();
};

const adminOnly = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

const adminAuthOnly = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      message: "Admin authentication required",
    });
  }

  next();
};

module.exports = {
  protect,
  allowRoles,
  adminOnly,
  adminAuthOnly,
};
