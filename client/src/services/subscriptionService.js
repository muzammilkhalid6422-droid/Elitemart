import api from "./api";

export const PAYMENT_NUMBER = "03294690927";

export const getMyPaymentRequests = async () => {
  const response = await api.get("/seller/payment-requests");
  return response.data.paymentRequests || [];
};

export const submitPaymentRequest = async (payload) => {
  const response = await api.post("/seller/payment-requests", payload);
  return response.data;
};
