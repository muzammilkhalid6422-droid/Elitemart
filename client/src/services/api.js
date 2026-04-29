import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const url = config.url || "";
  const activeRole = localStorage.getItem("activeAuthRole");
  const roleToken =
    activeRole === "seller"
      ? localStorage.getItem("sellerToken")
      : activeRole === "user"
        ? localStorage.getItem("userToken")
        : null;

  // Check for admin token first (for admin routes)
  if (url.includes("/admin/")) {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else if (url.includes("/seller")) {
    const sellerToken = localStorage.getItem("sellerToken") || roleToken;
    if (sellerToken) {
      config.headers.Authorization = `Bearer ${sellerToken}`;
    }
  } else if (url.includes("/cart") || url.includes("/favorites") || url.includes("/my-orders")) {
    const userToken = localStorage.getItem("userToken") || roleToken;
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  } else {
    // For regular user/seller routes
    const token = roleToken || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
