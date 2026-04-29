const { paymentRequestsStore, sellersStore } = require("../db/datastores");

const PAYMENT_NUMBER = "03294690927";
const PAID_PLANS = new Set(["premium", "business"]);
const PAYMENT_METHODS = new Set(["JazzCash", "EasyPaisa", "Bank Transfer"]);

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const sanitizeRequest = (request) => ({
  id: request._id,
  sellerId: request.sellerId,
  sellerName: request.sellerName,
  sellerEmail: request.sellerEmail,
  selectedPlan: request.selectedPlan,
  paymentMethod: request.paymentMethod,
  paymentNumber: request.paymentNumber,
  transactionId: request.transactionId,
  screenshot: request.screenshot,
  status: request.status,
  reviewedAt: request.reviewedAt || null,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const submitPaymentRequest = async (req, res) => {
  try {
    const { selectedPlan, paymentMethod, transactionId, screenshot } = req.body;
    const plan = String(selectedPlan || "").toLowerCase();

    if (!PAID_PLANS.has(plan)) {
      return res.status(400).json({ message: "Select Premium or Business plan" });
    }

    if (!PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ message: "Select a valid payment method" });
    }

    if (!String(transactionId || "").trim()) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    if (!String(screenshot || "").trim()) {
      return res.status(400).json({ message: "Transaction screenshot is required" });
    }

    const request = await paymentRequestsStore.insert({
      sellerId: req.user._id,
      sellerName: req.user.name || "",
      sellerEmail: req.user.email || "",
      selectedPlan: plan,
      paymentMethod,
      paymentNumber: PAYMENT_NUMBER,
      transactionId: String(transactionId).trim(),
      screenshot: String(screenshot).trim(),
      status: "pending",
    });

    return res.status(201).json({
      message: "Payment record submitted. Please wait for admin approval.",
      paymentRequest: sanitizeRequest(request),
    });
  } catch (error) {
    console.error("Submit payment request error:", error);
    return res.status(500).json({ message: "Unable to submit payment record" });
  }
};

const getMyPaymentRequests = async (req, res) => {
  try {
    const requests = await paymentRequestsStore
      .find({ sellerId: req.user._id })
      .sort({ createdAt: -1 });

    return res.json({ paymentRequests: requests.map(sanitizeRequest) });
  } catch (error) {
    console.error("Get seller payment requests error:", error);
    return res.status(500).json({ message: "Unable to fetch payment records" });
  }
};

const getPaymentRequests = async (_req, res) => {
  try {
    const requests = await paymentRequestsStore.find({}).sort({ createdAt: -1 });
    return res.json({ paymentRequests: requests.map(sanitizeRequest) });
  } catch (error) {
    console.error("Get payment requests error:", error);
    return res.status(500).json({ message: "Unable to fetch payment records" });
  }
};

const approvePaymentRequest = async (req, res) => {
  try {
    const request = await paymentRequestsStore.findOne({ _id: req.params.id });

    if (!request) return res.status(404).json({ message: "Payment request not found" });

    const seller = await sellersStore.findOne({ _id: request.sellerId });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const startDate = new Date().toISOString();
    const endDate = addDays(30);

    await sellersStore.update(
      { _id: request.sellerId },
      {
        $set: {
          plan: request.selectedPlan,
          isPremium: true,
          subscriptionStatus: "active",
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          planStartDate: startDate,
          planExpiry: endDate,
        },
      },
      {}
    );

    await paymentRequestsStore.update(
      { _id: req.params.id },
      { $set: { status: "approved", reviewedAt: new Date().toISOString() } },
      {}
    );

    const updated = await paymentRequestsStore.findOne({ _id: req.params.id });
    return res.json({
      message: "Payment approved and seller subscription activated",
      paymentRequest: sanitizeRequest(updated),
    });
  } catch (error) {
    console.error("Approve payment request error:", error);
    return res.status(500).json({ message: "Unable to approve payment request" });
  }
};

const rejectPaymentRequest = async (req, res) => {
  try {
    const request = await paymentRequestsStore.findOne({ _id: req.params.id });
    if (!request) return res.status(404).json({ message: "Payment request not found" });

    await paymentRequestsStore.update(
      { _id: req.params.id },
      { $set: { status: "rejected", reviewedAt: new Date().toISOString() } },
      {}
    );

    const updated = await paymentRequestsStore.findOne({ _id: req.params.id });
    return res.json({
      message: "Payment request rejected",
      paymentRequest: sanitizeRequest(updated),
    });
  } catch (error) {
    console.error("Reject payment request error:", error);
    return res.status(500).json({ message: "Unable to reject payment request" });
  }
};

module.exports = {
  PAYMENT_NUMBER,
  approvePaymentRequest,
  getMyPaymentRequests,
  getPaymentRequests,
  rejectPaymentRequest,
  submitPaymentRequest,
};
