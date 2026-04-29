import api from "./api";

export const placeOrder = async (payload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/orders/my-orders");
  return response.data.orders;
};

export const getSellerOrders = async () => {
  const response = await api.get("/orders/seller");
  return response.data.orders;
};

export const getAdminOrders = async () => {
  const adminToken = localStorage.getItem("adminToken");
  const response = await api.get("/orders/admin/all", {
    headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
  });
  return response.data.orders;
};

export const updateSubOrderStatus = async (orderId, subOrderId, status, options = {}) => {
  const adminToken = localStorage.getItem("adminToken");
  const response = await api.patch(
    `/orders/${orderId}/sub-orders/${subOrderId}/status`,
    {
      status,
    },
    {
      headers:
        options.admin && adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : {},
    }
  );
  return response.data.order;
};

export const markSubOrderReceived = async (orderId, subOrderId) => {
  const response = await api.patch(`/orders/${orderId}/sub-orders/${subOrderId}/received`);
  return response.data.order;
};
