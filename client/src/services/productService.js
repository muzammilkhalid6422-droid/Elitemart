import api from "./api";

export const getProducts = async () => {
  const response = await api.get("/products");
  return response.data.products;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data.product;
};

export const getProductReviews = async (id) => {
  const response = await api.get(`/products/${id}/reviews`);
  return response.data;
};

export const submitProductReview = async (id, payload) => {
  const response = await api.post(`/products/${id}/reviews`, payload);
  return response.data;
};

export const getSellerProducts = async () => {
  const response = await api.get("/products/seller/my-products");
  return response.data.products;
};

export const createProduct = async (payload) => {
  const response = await api.post("/products", payload);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
