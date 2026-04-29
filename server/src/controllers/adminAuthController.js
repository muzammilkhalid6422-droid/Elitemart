const jwt = require("jsonwebtoken");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin@12345";

const buildAdminToken = () =>
  jwt.sign(
    {
      id: "admin_user",
      email: "admin@ecommerce.com",
      role: "admin",
    },
    process.env.JWT_SECRET || "development-secret",
    {
      expiresIn: "7d",
    }
  );

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    if (
      String(username).trim() !== ADMIN_USERNAME ||
      String(password).trim() !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const token = buildAdminToken();

    return res.json({
      message: "Admin login successful",
      token: token,
      admin: {
        id: "admin_user",
        username: ADMIN_USERNAME,
        email: "admin@ecommerce.com",
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      message: "Unable to login as admin",
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    return res.json({
      admin: {
        id: "admin_user",
        username: ADMIN_USERNAME,
        email: "admin@ecommerce.com",
        role: "admin",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch admin profile",
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
};
