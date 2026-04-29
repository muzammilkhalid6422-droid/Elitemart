import api from "./api";

export const getMarketTrends = async ({ days = 7, category = "all" } = {}) => {
  const response = await api.get("/seller/market-trends", {
    params: { days, category },
  });

  return response.data;
};
