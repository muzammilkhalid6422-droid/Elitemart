import api from "./api";

export const getFavorites = async () => {
  const response = await api.get("/user/favorites");
  return response.data;
};

export const toggleFavorite = async (productId) => {
  const response = await api.post("/user/favorites", { productId });
  return response.data;
};

export const removeFavorite = async (productId) => {
  const response = await api.delete(`/user/favorites/${productId}`);
  return response.data;
};
