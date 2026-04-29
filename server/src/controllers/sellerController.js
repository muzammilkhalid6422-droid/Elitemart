const { sellersStore } = require("../db/datastores");

const sanitizeSeller = (seller) => ({
  id: seller._id,
  name: seller.name,
  email: seller.email,
  phone: seller.phone || "",
  country: seller.country || "",
  region: seller.region || "",
  avatar: seller.avatar || "",
  companyName: seller.companyName || "",
  paymentAccountNumber: seller.paymentAccountNumber || "",
  cnicFront: seller.cnicFront || "",
  cnicBack: seller.cnicBack || "",
  isApproved: seller.isApproved || false,
  role: "seller",
});

exports.getSellerProfile = async (req, res) => {
  if (req.userRole !== "seller") {
    return res.status(403).json({ message: "Access denied" });
  }

  return res.json({ seller: sanitizeSeller(req.user) });
};

exports.updateSellerProfile = async (req, res) => {
  if (req.userRole !== "seller") {
    return res.status(403).json({ message: "Access denied" });
  }

  const {
    name,
    email,
    phone = "",
    country = "",
    region = "",
    companyName = "",
    paymentAccountNumber = "",
  } = req.body;

  await sellersStore.update(
    { _id: req.user._id },
    {
      $set: {
        name,
        email,
        phone,
        country,
        region,
        companyName,
        paymentAccountNumber,
      },
    },
    {}
  );

  const updated = await sellersStore.findOne({ _id: req.user._id });

  return res.json({
    message: "Seller updated",
    seller: sanitizeSeller(updated),
  });
};
