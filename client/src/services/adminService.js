import api from "./api";

export const getPaidSellers = async () => {
  const response = await api.get("/admin/sellers/premium");
  return response.data;
};

export const upgradeSeller = async (sellerId, durationMonths = 3) => {
  const response = await api.put(`/admin/sellers/${sellerId}/upgrade`, {
    durationMonths,
  });
  return response.data;
};

export const extendSellerPlan = async (sellerId, durationMonths = 3) => {
  const response = await api.put(`/admin/sellers/${sellerId}/extend-plan`, {
    durationMonths,
  });
  return response.data;
};

export const downgradeSeller = async (sellerId) => {
  const response = await api.put(`/admin/sellers/${sellerId}/downgrade`);
  return response.data;
};

export const getPaymentRequests = async () => {
  const response = await api.get("/admin/payment-requests");
  return response.data;
};

export const approvePaymentRequest = async (requestId) => {
  const response = await api.put(`/admin/payment-requests/${requestId}/approve`);
  return response.data;
};

export const rejectPaymentRequest = async (requestId) => {
  const response = await api.put(`/admin/payment-requests/${requestId}/reject`);
  return response.data;
};
