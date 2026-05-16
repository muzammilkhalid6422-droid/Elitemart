import api from "./api";

// REGISTER USER
export const registerUser = (data) => {
  return api.post("/auth/register/user", data);
};

// REGISTER SELLER
export const registerSeller = (data) => {
  return api.post("/auth/register/seller", data);
};

export const requestRegistrationOtp = (data) => {
  return api.post("/auth/register/request-otp", data);
};

// LOGIN USER/SELLER
export const loginUser = (data) => {
  return api.post("/auth/login", data);
};

export const loginWithGoogle = (data) => {
  return api.post("/auth/google", data);
};

// ADMIN LOGIN
export const loginAdmin = (data) => {
  return api.post("/admin/auth/login", data);
};

export const getProfile = () => {
  return api.get("/auth/profile");
};

export const updateProfile = (data) => {
  return api.put("/auth/profile", data);
};
