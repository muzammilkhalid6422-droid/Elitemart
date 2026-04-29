import { useEffect, useMemo, useState } from "react";
import { Bell, Database, Save, Settings, ShieldCheck, Store } from "lucide-react";
import api from "../../services/api";
import { useBranding } from "../../context/BrandingContext";
import "./AdminPages.css";

const defaultSettings = {
  marketplaceName: "EliteMart",
  sellerApprovalRequired: true,
  autoCompleteOrders: true,
  lowStockAlert: 5,
  supportEmail: "support@elitemart.local",
  orderNotifications: true,
};

const AdminSettings = () => {
  const { refreshBranding } = useBranding();
  const [settings, setSettings] = useState(defaultSettings);
  const [admin, setAdmin] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const [profileResponse, settingsResponse] = await Promise.all([
          api.get("/admin/auth/profile"),
          api.get("/admin/settings"),
        ]);
        setAdmin(profileResponse.data.admin);
        setSettings({ ...defaultSettings, ...(settingsResponse.data.settings || {}) });
      } catch {
        setAdmin(JSON.parse(localStorage.getItem("adminUser") || "null"));
      }
    };

    fetchAdminSettings();
  }, []);

  const settingSummary = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: "Seller Approval",
        value: settings.sellerApprovalRequired ? "Required" : "Open",
      },
      {
        icon: Bell,
        title: "Order Notifications",
        value: settings.orderNotifications ? "Enabled" : "Disabled",
      },
      {
        icon: Database,
        title: "Auto Complete",
        value: settings.autoCompleteOrders ? "3 days after delivery" : "Manual only",
      },
    ],
    [settings]
  );

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      const response = await api.put("/admin/settings", settings);
      setSettings({ ...defaultSettings, ...(response.data.settings || {}) });
      await refreshBranding();
      setMessage(response.data.message || "Settings saved successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Settings save nahi ho saki.");
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage admin profile and marketplace preferences</p>
      </div>

      {message && <div className="admin-message success">{message}</div>}

      <div className="settings-summary-grid">
        {settingSummary.map((item) => (
          <div className="settings-summary-card" key={item.title}>
            <item.icon size={24} />
            <span>{item.title}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-header">
            <Store size={20} />
            <h2>Marketplace Settings</h2>
          </div>

          <form onSubmit={handleSave} className="settings-form">
            <label>
              Marketplace Name
              <input
                type="text"
                name="marketplaceName"
                value={settings.marketplaceName}
                onChange={handleChange}
              />
            </label>

            <label>
              Support Email
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleChange}
              />
            </label>

            <label>
              Low Stock Alert Limit
              <input
                type="number"
                name="lowStockAlert"
                min="0"
                value={settings.lowStockAlert}
                onChange={handleChange}
              />
            </label>

            <div className="settings-toggle-row">
              <span>
                <strong>Seller approval required</strong>
                <small>New sellers need admin approval before login.</small>
              </span>
              <input
                type="checkbox"
                name="sellerApprovalRequired"
                checked={settings.sellerApprovalRequired}
                onChange={handleChange}
              />
            </div>

            <div className="settings-toggle-row">
              <span>
                <strong>Auto-complete delivered orders</strong>
                <small>Orders complete automatically after 3 days.</small>
              </span>
              <input
                type="checkbox"
                name="autoCompleteOrders"
                checked={settings.autoCompleteOrders}
                onChange={handleChange}
              />
            </div>

            <div className="settings-toggle-row">
              <span>
                <strong>Order notifications</strong>
                <small>Notify admins about major order changes.</small>
              </span>
              <input
                type="checkbox"
                name="orderNotifications"
                checked={settings.orderNotifications}
                onChange={handleChange}
              />
            </div>

            <button className="settings-save-btn" type="submit">
              <Save size={17} />
              Save Settings
            </button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <Settings size={20} />
            <h2>Admin Profile</h2>
          </div>

          <div className="admin-profile-panel">
            <div className="admin-avatar-large">A</div>
            <div>
              <h3>{admin?.username || "admin"}</h3>
              <p>{admin?.email || "admin@ecommerce.com"}</p>
              <span className="status-badge active">{admin?.role || "admin"}</span>
            </div>
          </div>

          <div className="settings-note">
            <ShieldCheck size={18} />
            Admin credentials are managed from backend auth configuration. Marketplace display preferences are saved for the full website.
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
