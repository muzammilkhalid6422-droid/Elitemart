const PREMIUM_PLAN = "premium";
const BUSINESS_PLAN = "business";

const toDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getRemainingDays = (planExpiry) => {
  const expiryDate = toDate(planExpiry);

  if (!expiryDate) return 0;

  const diffMs = expiryDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

export const hasPremiumPlan = (seller) => {
  if (!seller) return false;

  const plan = String(seller.plan || "").toLowerCase();
  const endDate = seller.subscriptionEndDate || seller.planExpiry;
  const status = seller.subscriptionStatus || (seller.isPremium ? "active" : "free");

  if (plan !== PREMIUM_PLAN && plan !== BUSINESS_PLAN) return false;
  if (seller.isPremium === false) return false;
  if (status !== "active") return false;

  if (!endDate) return true;
  return getRemainingDays(endDate) > 0;
};

export const getPlanStatus = (seller) => {
  if (!seller) return "Free Plan";

  if (!hasPremiumPlan(seller)) {
    return ["premium", "business"].includes(String(seller.plan || "").toLowerCase())
      ? "Premium Expired"
      : "Free Plan";
  }

  const endDate = seller.subscriptionEndDate || seller.planExpiry;
  const days = getRemainingDays(endDate);
  const label = String(seller.plan || "").toLowerCase() === BUSINESS_PLAN ? "Business Plan" : "Premium Plan";
  return endDate ? `${label} (${days} days left)` : label;
};
