const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const trafficRoutes = require("./routes/trafficRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const normalizeOrigin = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin;
  } catch (_error) {
    return trimmed.replace(/\/+$/, "");
  }
};
const CLIENT_URLS = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);
const isAllowedPreviewOrigin = (origin = "") =>
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin) ||
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
const REQUEST_LIMIT = process.env.REQUEST_LIMIT || "50mb";
app.use(
  cors({
    origin: (origin, callback) => {
      const requestOrigin = normalizeOrigin(origin);
      if (
        !origin ||
        CLIENT_URLS.includes(requestOrigin) ||
        isAllowedPreviewOrigin(requestOrigin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy does not allow access from ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: REQUEST_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_LIMIT }));

app.get("/", (_req, res) => {
  res.json({
    message: "Ecommerce backend is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request is too large. Please upload a smaller image.",
    });
  }

  console.error(err);

  res.status(500).json({
    message: "Something went wrong on the server",
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
