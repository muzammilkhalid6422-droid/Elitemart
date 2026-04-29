const { settingsStore } = require("../db/datastores");

const SETTINGS_KEY = "site";

const defaultSettings = {
  marketplaceName: "EliteMart",
  supportEmail: "support@elitemart.local",
  sellerApprovalRequired: true,
  autoCompleteOrders: true,
  lowStockAlert: 5,
  orderNotifications: true,
};

const sanitizeSettings = (settings = {}) => ({
  marketplaceName: String(settings.marketplaceName || defaultSettings.marketplaceName).trim().slice(0, 60),
  supportEmail: String(settings.supportEmail || defaultSettings.supportEmail).trim().slice(0, 120),
  sellerApprovalRequired:
    typeof settings.sellerApprovalRequired === "boolean"
      ? settings.sellerApprovalRequired
      : defaultSettings.sellerApprovalRequired,
  autoCompleteOrders:
    typeof settings.autoCompleteOrders === "boolean"
      ? settings.autoCompleteOrders
      : defaultSettings.autoCompleteOrders,
  lowStockAlert: Math.max(0, Number(settings.lowStockAlert ?? defaultSettings.lowStockAlert) || 0),
  orderNotifications:
    typeof settings.orderNotifications === "boolean"
      ? settings.orderNotifications
      : defaultSettings.orderNotifications,
});

const readSiteSettings = async () => {
  const record = await settingsStore.findOne({ key: SETTINGS_KEY });
  return sanitizeSettings(record?.value || defaultSettings);
};

const getPublicSettings = async (_req, res) => {
  try {
    const settings = await readSiteSettings();

    return res.json({
      settings: {
        marketplaceName: settings.marketplaceName,
        supportEmail: settings.supportEmail,
      },
    });
  } catch (error) {
    console.error("Get public settings error:", error);
    return res.status(500).json({ message: "Unable to fetch settings" });
  }
};

const getAdminSettings = async (_req, res) => {
  try {
    return res.json({ settings: await readSiteSettings() });
  } catch (error) {
    console.error("Get admin settings error:", error);
    return res.status(500).json({ message: "Unable to fetch admin settings" });
  }
};

const updateAdminSettings = async (req, res) => {
  try {
    const settings = sanitizeSettings(req.body || {});

    await settingsStore.update(
      { key: SETTINGS_KEY },
      { $set: { key: SETTINGS_KEY, value: settings } },
      { upsert: true }
    );

    return res.json({
      message: "Settings saved successfully.",
      settings,
    });
  } catch (error) {
    console.error("Update admin settings error:", error);
    return res.status(500).json({ message: "Unable to save admin settings" });
  }
};

module.exports = {
  defaultSettings,
  getAdminSettings,
  getPublicSettings,
  readSiteSettings,
  updateAdminSettings,
};
