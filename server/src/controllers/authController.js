const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");

const { usersStore, sellersStore } = require("../db/datastores");
const { isPlanExpired, normalizeSellerPlan, formatPlanInfo, getPlanStatus } = require("../utils/planUtils");

const allowedRoles = new Set(["user", "seller", "admin"]);
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

const fetchJson = (url, options = {}) =>
  new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};

          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(parsed.error_description || parsed.error || "Request failed"));
            return;
          }

          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
    request.end();
  });

const getBase64SizeBytes = (image = "") => {
  const parts = String(image).split(",");
  const base64 = parts[1] || parts[0] || "";
  const padding = (base64.match(/=*$/) || [""])[0].length;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const buildToken = (user, role = "user") =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: role,
    },
    process.env.JWT_SECRET || "development-secret"
  );

const sanitizeUser = (user, role = "user") => {
  const sanitized = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    country: user.country || "",
    region: user.region || "",
    avatar: user.avatar || "",
    role: role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (role === "seller") {
    const seller = normalizeSellerPlan(user);

    sanitized.companyName = seller.companyName || "";
    sanitized.paymentAccountNumber = seller.paymentAccountNumber || "";
    sanitized.cnicFront = seller.cnicFront || "";
    sanitized.cnicBack = seller.cnicBack || "";
    sanitized.businessLicense = seller.businessLicense || "";
    sanitized.isApproved = seller.isApproved || false;
    sanitized.accountStatus = seller.isApproved ? "approved" : "pending";
    sanitized.plan = seller.plan;
    sanitized.isPremium = seller.isPremium;
    sanitized.subscriptionStatus = seller.subscriptionStatus;
    sanitized.subscriptionStartDate = seller.subscriptionStartDate;
    sanitized.subscriptionEndDate = seller.subscriptionEndDate;
    sanitized.planStartDate = seller.planStartDate;
    sanitized.planExpiry = seller.planExpiry;
    sanitized.planInfo = formatPlanInfo(seller);
    sanitized.planStatus = getPlanStatus(seller);
  }

  return sanitized;
};

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = "",
      country = "",
      region = "",
      avatar = "",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check in both stores to avoid duplicates
    const existingUser = await usersStore.findOne({ email: normalizedEmail });
    const existingSeller = await sellersStore.findOne({ email: normalizedEmail });

    if (existingUser || existingSeller) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedAvatar = String(avatar || "").trim();

    if (
      normalizedAvatar &&
      getBase64SizeBytes(normalizedAvatar) > MAX_AVATAR_SIZE_BYTES
    ) {
      return res.status(400).json({
        message: "Profile image is too large",
      });
    }

    const user = await usersStore.insert({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || "").trim(),
      country: String(country || "").trim(),
      region: String(region || "").trim(),
      avatar: normalizedAvatar,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful",
      token: buildToken(user, "user"),
      user: sanitizeUser(user, "user"),
    });
  } catch (error) {
    console.error("Register user error:", error);
    return res.status(500).json({
      message: "Unable to register user",
    });
  }
};

const registerSeller = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = "",
      country = "",
      region = "",
      avatar = "",
      companyName = "",
      paymentAccountNumber = "",
      cnicFront = "",
      cnicBack = "",
    } = req.body;

    if (!name || !email || !password || !phone || !country || !region) {
      return res.status(400).json({
        message: "Name, email, phone, password, country, and region are required",
      });
    }

    if (!companyName || !paymentAccountNumber || !cnicFront || !cnicBack) {
      return res.status(400).json({
        message: "Company name, payment account number and CNIC front/back images are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check in both stores to avoid duplicates
    const existingUser = await usersStore.findOne({ email: normalizedEmail });
    const existingSeller = await sellersStore.findOne({ email: normalizedEmail });

    if (existingUser || existingSeller) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Validate avatar
    const normalizedAvatar = String(avatar || "").trim();
    if (
      normalizedAvatar &&
      getBase64SizeBytes(normalizedAvatar) > MAX_AVATAR_SIZE_BYTES
    ) {
      return res.status(400).json({
        message: "Profile image is too large",
      });
    }

    // Validate CNIC Front
    const normalizedCnicFront = String(cnicFront || "").trim();
    if (
      normalizedCnicFront &&
      getBase64SizeBytes(normalizedCnicFront) > MAX_DOCUMENT_SIZE_BYTES
    ) {
      return res.status(400).json({
        message: "CNIC front image is too large",
      });
    }

    // Validate CNIC Back
    const normalizedCnicBack = String(cnicBack || "").trim();
    if (
      normalizedCnicBack &&
      getBase64SizeBytes(normalizedCnicBack) > MAX_DOCUMENT_SIZE_BYTES
    ) {
      return res.status(400).json({
        message: "CNIC back image is too large",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await sellersStore.insert({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || "").trim(),
      country: String(country || "").trim(),
      region: String(region || "").trim(),
      avatar: normalizedAvatar,
      password: hashedPassword,
      companyName: String(companyName || "").trim(),
      paymentAccountNumber: String(paymentAccountNumber || "").trim(),
      cnicFront: normalizedCnicFront,
      cnicBack: normalizedCnicBack,
      isApproved: false,
      plan: "free",
      isPremium: false,
      subscriptionStatus: "free",
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      planStartDate: null,
      planExpiry: null,
    });

    return res.status(201).json({
      message: "Seller registration successful. Pending admin approval.",
      user: sanitizeUser(seller, "seller"),
    });
  } catch (error) {
    console.error("Register seller error:", error);
    return res.status(500).json({
      message: "Unable to register seller",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check in users store
    let user = await usersStore.findOne({ email: normalizedEmail });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      return res.json({
        message: "Login successful",
        token: buildToken(user, "user"),
        user: sanitizeUser(user, "user"),
      });
    }

    // Check in sellers store
    let seller = await sellersStore.findOne({ email: normalizedEmail });
    if (seller) {
      seller = normalizeSellerPlan(seller);

      if (seller.isPremium && isPlanExpired(seller.subscriptionEndDate || seller.planExpiry)) {
        await sellersStore.update(
          { _id: seller._id },
          {
            $set: {
              plan: "free",
              isPremium: false,
              subscriptionStatus: "expired",
              subscriptionStartDate: null,
              subscriptionEndDate: seller.subscriptionEndDate || seller.planExpiry,
              planStartDate: null,
              planExpiry: null,
            },
          },
          {}
        );

        seller = {
          ...seller,
          plan: "free",
          isPremium: false,
          subscriptionStatus: "expired",
          subscriptionStartDate: null,
          subscriptionEndDate: seller.subscriptionEndDate || seller.planExpiry,
          planStartDate: null,
          planExpiry: null,
        };
      }

      if (!seller.isApproved) {
        return res.status(403).json({
          message: "Your seller account is pending approval",
        });
      }

      const isMatch = await bcrypt.compare(password, seller.password);
      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      return res.json({
        message: "Login successful",
        token: buildToken(seller, "seller"),
        user: sanitizeUser(seller, "seller"),
      });
    }

    return res.status(401).json({
      message: "Invalid email or password",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Unable to login",
    });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { accessToken = "" } = req.body;

    if (!String(accessToken || "").trim()) {
      return res.status(400).json({
        message: "Google access token is required",
      });
    }

    const googleProfile = await fetchJson("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!googleProfile.email || googleProfile.email_verified === false) {
      return res.status(401).json({
        message: "Google email is not verified",
      });
    }

    const normalizedEmail = String(googleProfile.email).trim().toLowerCase();
    const existingSeller = await sellersStore.findOne({ email: normalizedEmail });

    if (existingSeller) {
      return res.status(409).json({
        message: "This email is registered as seller. Please login with email and password.",
      });
    }

    let user = await usersStore.findOne({ email: normalizedEmail });

    if (!user) {
      const generatedPassword = await bcrypt.hash(
        `${googleProfile.sub || normalizedEmail}-${Date.now()}`,
        10
      );

      user = await usersStore.insert({
        name: String(googleProfile.name || normalizedEmail.split("@")[0]).trim(),
        email: normalizedEmail,
        phone: "",
        country: "",
        region: "",
        avatar: String(googleProfile.picture || "").trim(),
        password: generatedPassword,
        googleId: googleProfile.sub || "",
        authProvider: "google",
      });
    } else {
      await usersStore.update(
        { _id: user._id },
        {
          $set: {
            googleId: user.googleId || googleProfile.sub || "",
            authProvider: user.authProvider || "google",
            avatar: user.avatar || String(googleProfile.picture || "").trim(),
          },
        },
        {}
      );

      user = await usersStore.findOne({ _id: user._id });
    }

    return res.json({
      message: "Google login successful",
      token: buildToken(user, "user"),
      user: sanitizeUser(user, "user"),
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({
      message: "Google login failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    return res.json({
      user: sanitizeUser(req.user, req.userRole),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone = "",
      country = "",
      region = "",
      password = "",
      currentPassword = "",
      avatar,
      companyName = "",
      paymentAccountNumber = "",
      cnicFront,
      cnicBack,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const store = req.userStore === "seller" ? sellersStore : usersStore;
    const otherStore = req.userStore === "seller" ? usersStore : sellersStore;

    // Check for duplicate email
    const existingInSameStore = await store.findOne({ 
      email: normalizedEmail,
      _id: { $ne: req.user._id }
    });
    const existingInOtherStore = await otherStore.findOne({ email: normalizedEmail });

    if (existingInSameStore || existingInOtherStore) {
      return res.status(409).json({
        message: "Another user already exists with this email",
      });
    }

    const updates = {
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone || "").trim(),
      country: String(country || "").trim(),
      region: String(region || "").trim(),
    };

    if (avatar !== undefined) {
      const normalizedAvatar = String(avatar || "").trim();

      if (
        normalizedAvatar &&
        getBase64SizeBytes(normalizedAvatar) > MAX_AVATAR_SIZE_BYTES
      ) {
        return res.status(400).json({
          message: "Profile image is too large",
        });
      }

      updates.avatar = normalizedAvatar;
    }

    if (req.userRole === "seller") {
      if (companyName) {
        updates.companyName = String(companyName).trim();
      }

      if (paymentAccountNumber) {
        updates.paymentAccountNumber = String(paymentAccountNumber).trim();
      }

      if (cnicFront) {
        if (getBase64SizeBytes(cnicFront) > MAX_DOCUMENT_SIZE_BYTES) {
          return res.status(400).json({
            message: "CNIC front image is too large",
          });
        }
        updates.cnicFront = String(cnicFront).trim();
      }

      if (cnicBack) {
        if (getBase64SizeBytes(cnicBack) > MAX_DOCUMENT_SIZE_BYTES) {
          return res.status(400).json({
            message: "CNIC back image is too large",
          });
        }
        updates.cnicBack = String(cnicBack).trim();
      }
    }

    if (String(password || "").trim()) {
      const hasCurrentPassword = String(currentPassword || "").trim();

      if (!hasCurrentPassword) {
        return res.status(400).json({
          message: "Current password is required to set a new password",
        });
      }

      const isMatch = await bcrypt.compare(
        String(currentPassword).trim(),
        req.user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      updates.password = await bcrypt.hash(String(password).trim(), 10);
    }

    await store.update({ _id: req.user._id }, { $set: updates }, {});
    const updatedUser = await store.findOne({ _id: req.user._id });

    return res.json({
      message: "Profile updated successfully",
      user: sanitizeUser(updatedUser, req.userRole),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Unable to update profile",
    });
  }
};

module.exports = {
  registerUser,
  registerSeller,
  loginUser,
  loginWithGoogle,
  getProfile,
  updateProfile,
};
