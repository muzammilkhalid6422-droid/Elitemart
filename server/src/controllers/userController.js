const { usersStore } = require("../db/datastores");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  avatar: user.avatar || "",
  role: user.role,
});

exports.getUserProfile = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({ user: sanitizeUser(req.user) });
};

exports.updateUserProfile = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { name, email, phone } = req.body;

  await usersStore.update(
    { _id: req.user._id },
    { $set: { name, email, phone } }
  );

  const updated = await usersStore.findOne({ _id: req.user._id });

  res.json({
    message: "User updated",
    user: sanitizeUser(updated),
  });
};