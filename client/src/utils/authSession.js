const sessionKeys = {
  user: { token: "userToken", account: "userAccount" },
  seller: { token: "sellerToken", account: "sellerAccount" },
  admin: { token: "adminToken", account: "adminUser" },
};

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const getRoleSession = (role) => {
  const keys = sessionKeys[role];
  if (!keys) return null;

  const token = localStorage.getItem(keys.token);
  const user = safeParse(localStorage.getItem(keys.account));

  if (token && user) return { token, user };

  const legacyToken = localStorage.getItem("token");
  const legacyUser = safeParse(localStorage.getItem("user"));

  if (legacyToken && legacyUser?.role === role) {
    localStorage.setItem(keys.token, legacyToken);
    localStorage.setItem(keys.account, JSON.stringify(legacyUser));
    localStorage.setItem("activeAuthRole", role);
    return { token: legacyToken, user: legacyUser };
  }

  return null;
};

export const setActiveSession = (role) => {
  const session = getRoleSession(role);
  if (!session) return null;

  localStorage.setItem("token", session.token);
  localStorage.setItem("user", JSON.stringify(session.user));
  localStorage.setItem("activeAuthRole", role);
  return session;
};

export const saveAuthSession = (user, token) => {
  const role = user?.role;
  const keys = sessionKeys[role];

  if (!keys || !token || !user) return;

  localStorage.setItem(keys.token, token);
  localStorage.setItem(keys.account, JSON.stringify(user));
  setActiveSession(role);
};

export const clearAuthSession = (role) => {
  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeAuthRole");
    Object.values(sessionKeys).forEach((keys) => {
      localStorage.removeItem(keys.token);
      localStorage.removeItem(keys.account);
    });
    return;
  }

  const keys = sessionKeys[role];
  if (!keys) return;

  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.account);

  if (localStorage.getItem("activeAuthRole") === role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeAuthRole");
  }
};

export const getActiveAuthUser = () => {
  const activeRole = localStorage.getItem("activeAuthRole");
  const activeSession = activeRole ? getRoleSession(activeRole) : null;
  if (activeSession) return activeSession.user;

  const token = localStorage.getItem("token");
  const user = safeParse(localStorage.getItem("user"));
  return token && user ? user : null;
};
