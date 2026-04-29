const PREMIUM_PLAN = "premium";
const BUSINESS_PLAN = "business";
const DEFAULT_PREMIUM_MONTHS = 3;

const toDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (value, months = DEFAULT_PREMIUM_MONTHS) => {
  const date = toDate(value) || new Date();
  date.setMonth(date.getMonth() + Number(months || DEFAULT_PREMIUM_MONTHS));
  return date.toISOString();
};

const isPlanExpired = (planExpiry) => {
  const expiry = toDate(planExpiry);
  return Boolean(expiry && expiry.getTime() <= Date.now());
};

const getRemainingDays = (planExpiry) => {
  const expiry = toDate(planExpiry);
  if (!expiry) return 0;

  const diffMs = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const normalizeSellerPlan = (seller = {}) => {
  const plan = String(seller.plan || "free").toLowerCase();
  const subscriptionEndDate = seller.subscriptionEndDate || seller.planExpiry || null;
  const activePlan = plan === PREMIUM_PLAN || plan === BUSINESS_PLAN ? plan : "free";

  return {
    ...seller,
    plan: activePlan,
    isPremium: Boolean(seller.isPremium || activePlan === PREMIUM_PLAN || activePlan === BUSINESS_PLAN),
    subscriptionStatus: seller.subscriptionStatus || (activePlan === "free" ? "free" : "active"),
    subscriptionStartDate: seller.subscriptionStartDate || seller.planStartDate || null,
    subscriptionEndDate,
    planStartDate: seller.planStartDate || seller.subscriptionStartDate || null,
    planExpiry: seller.planExpiry || subscriptionEndDate,
  };
};

const hasPremiumPlan = (seller = {}) => {
  const normalized = normalizeSellerPlan(seller);
  return (
    normalized.isPremium === true &&
    normalized.subscriptionStatus === "active" &&
    (normalized.plan === PREMIUM_PLAN || normalized.plan === BUSINESS_PLAN) &&
    (!normalized.subscriptionEndDate || !isPlanExpired(normalized.subscriptionEndDate))
  );
};

const getPlanStatus = (seller = {}) => {
  const normalized = normalizeSellerPlan(seller);

  if (!hasPremiumPlan(normalized)) {
    return normalized.plan === PREMIUM_PLAN ? "Premium Expired" : "Free Plan";
  }

  const label = normalized.plan === BUSINESS_PLAN ? "Business Plan" : "Premium Plan";

  return normalized.subscriptionEndDate
    ? `${label} (${getRemainingDays(normalized.subscriptionEndDate)} days left)`
    : label;
};

const formatPlanInfo = (seller = {}) => ({
  plan: normalizeSellerPlan(seller).plan,
  isPremium: hasPremiumPlan(seller),
  subscriptionStatus: normalizeSellerPlan(seller).subscriptionStatus,
  planStartDate: seller.planStartDate || seller.subscriptionStartDate || null,
  planExpiry: seller.planExpiry || seller.subscriptionEndDate || null,
  subscriptionStartDate: seller.subscriptionStartDate || seller.planStartDate || null,
  subscriptionEndDate: seller.subscriptionEndDate || seller.planExpiry || null,
  remainingDays: getRemainingDays(seller.subscriptionEndDate || seller.planExpiry),
  status: getPlanStatus(seller),
});

module.exports = {
  addMonths,
  formatPlanInfo,
  getPlanStatus,
  getRemainingDays,
  hasPremiumPlan,
  isPlanExpired,
  normalizeSellerPlan,
};
