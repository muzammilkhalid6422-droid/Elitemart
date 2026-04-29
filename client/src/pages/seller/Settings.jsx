import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Building2, Camera, Check, Crown, Lock, Mail, MapPin, Phone, Upload, X } from "lucide-react";
import { updateProfile } from "../../services/authService";
import { getPlanStatus, getRemainingDays, hasPremiumPlan } from "../../services/planService";
import {
  PAYMENT_NUMBER,
  getMyPaymentRequests,
  submitPaymentRequest,
} from "../../services/subscriptionService";
import "./Settings.css";

const plans = [
  {
    id: "free",
    title: "Free Plan",
    price: "$0",
    note: "Perfect for getting started",
    features: ["Basic store profile", "Limited products", "Basic support"],
  },
  {
    id: "premium",
    title: "Premium Plan",
    price: "$9.99",
    note: "Best for growing businesses",
    featured: true,
    features: ["All free features", "Unlimited products", "Advanced analytics", "Priority support"],
  },
  {
    id: "business",
    title: "Business Plan",
    price: "$19.99",
    note: "For larger scale operations",
    features: ["All premium features", "AI insights", "Custom branding", "Dedicated account manager"],
  },
];

const paymentMethods = ["JazzCash", "EasyPaisa", "Bank Transfer"];

const Settings = () => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    region: "",
    companyName: "",
    paymentAccountNumber: "",
    avatar: "",
    cnicFront: "",
    cnicBack: "",
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [sellerPlan, setSellerPlan] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [paymentRequests, setPaymentRequests] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return;

    try {
      const userData = JSON.parse(user);
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        country: userData.country || "",
        region: userData.region || "",
        companyName: userData.companyName || "",
        paymentAccountNumber: userData.paymentAccountNumber || "",
        avatar: userData.avatar || "",
        cnicFront: userData.cnicFront || "",
        cnicBack: userData.cnicBack || "",
      }));
      setProfileImage(userData.avatar || null);
      setCnicFront(userData.cnicFront || null);
      setCnicBack(userData.cnicBack || null);
      setSellerPlan(userData);
    } catch (error) {
      console.error("Error loading seller data:", error);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadPaymentRequests = async () => {
      try {
        const requests = await getMyPaymentRequests();
        if (!ignore) setPaymentRequests(requests);
      } catch (error) {
        console.error("Payment requests load error:", error);
      }
    };

    loadPaymentRequests();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (type === "avatar") {
        setProfileImage(result);
        setFormData((prev) => ({ ...prev, avatar: result }));
      }

      if (type === "cnicFront") {
        setCnicFront(result);
        setFormData((prev) => ({ ...prev, cnicFront: result }));
      }

      if (type === "cnicBack") {
        setCnicBack(result);
        setFormData((prev) => ({ ...prev, cnicBack: result }));
      }

      setMessage("Image selected successfully.");
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentScreenshot = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPaymentScreenshot(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || selectedPlan === "free") {
      setMessage("Select Premium or Business plan.");
      return;
    }

    if (!paymentMethod) {
      setMessage("Select a payment method.");
      return;
    }

    if (!transactionId.trim()) {
      setMessage("Transaction ID is required.");
      return;
    }

    if (!paymentScreenshot) {
      setMessage("Upload transaction screenshot.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await submitPaymentRequest({
        selectedPlan,
        paymentMethod,
        paymentNumber: PAYMENT_NUMBER,
        transactionId,
        screenshot: paymentScreenshot,
      });
      const requests = await getMyPaymentRequests();
      setPaymentRequests(requests);
      setUpgradeOpen(false);
      setTransactionId("");
      setPaymentMethod("");
      setPaymentScreenshot("");
      setMessage(response.message || "Payment record submitted. Please wait for admin approval.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Payment record submit nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        region: formData.region,
        companyName: formData.companyName,
        paymentAccountNumber: formData.paymentAccountNumber,
        avatar: formData.avatar,
        cnicFront: formData.cnicFront,
        cnicBack: formData.cnicBack,
      });

      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSellerPlan(response.data.user);
      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Update error:", error);
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      setMessage("Fill password fields first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        region: formData.region,
        companyName: formData.companyName,
        paymentAccountNumber: formData.paymentAccountNumber,
        password: formData.newPassword,
        currentPassword: formData.currentPassword,
      });

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
      setMessage("Password changed successfully.");
    } catch (error) {
      console.error("Password change error:", error);
      setMessage(error.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div>
          <h1 className="settings-title">Seller Profile</h1>
          <p>Manage your store identity, subscription, documents, and account security.</p>
        </div>
        <span className={sellerPlan?.isApproved ? "settings-status approved" : "settings-status pending"}>
          <BadgeCheck size={16} />
          {sellerPlan?.isApproved ? "Approved Seller" : "Pending Approval"}
        </span>
      </section>

      {message && <div className="settings-message">{message}</div>}
      {paymentRequests[0]?.status === "pending" && (
        <div className="settings-message pending-message">
          Your {paymentRequests[0].selectedPlan} payment is pending admin approval.
        </div>
      )}
      {sellerPlan?.subscriptionStatus === "expired" && (
        <div className="settings-message expired-message">
          Your subscription has expired. Premium features are locked until renewal.
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-card profile-card">
          <h2>Profile</h2>

          <div className="profile-center">
            <div className="profile-img">
              {profileImage ? (
                <img src={profileImage} alt="profile" />
              ) : (
                <div className="avatar-placeholder">No Image</div>
              )}
              <div className="img-overlay" onClick={() => fileInputRef.current?.click()}>
                <Camera size={20} />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={(event) => handleImageChange(event, "avatar")}
            />

            <h3>{formData.name || "Seller Name"}</h3>
            <p>{formData.email || "seller@example.com"}</p>

            <button type="button" onClick={() => fileInputRef.current?.click()} className="primary-btn">
              Update Photo
            </button>
          </div>

          <div className="info-box">
            <p><BadgeCheck size={15} /> <span>Store Status<small>Your store is currently approved</small></span></p>
            <span>{sellerPlan?.isApproved ? "Approved" : "Pending Approval"}</span>
          </div>

          <div className="info-box">
            <p><Crown size={15} /> <span>Current Plan<small>Manage your subscription plan</small></span></p>
            <span>{hasPremiumPlan(sellerPlan) ? "Premium Plan" : "Free Plan"}</span>
          </div>

              <div className="info-box">
                <p><Building2 size={15} /> <span>Company<small>Business type and category</small></span></p>
                <span>{formData.companyName || "N/A"}</span>
              </div>

              <div className="info-box">
                <p><Phone size={15} /> <span>Payment Account<small>Shown to customers at checkout</small></span></p>
                <span>{formData.paymentAccountNumber || "N/A"}</span>
              </div>
        </div>

        <div className="settings-right">
          <div className="settings-card">
            <h2><Crown size={16} /> Subscription</h2>

            <div className="info-box">
              <p>Plan Type</p>
              <span>{hasPremiumPlan(sellerPlan) ? "Premium Plan" : "Free Plan"}</span>
            </div>

            <div className="info-box">
              <p>Expiry</p>
              <span>
                {hasPremiumPlan(sellerPlan) && sellerPlan?.planExpiry
                  ? new Date(sellerPlan.planExpiry).toLocaleDateString("en-PK")
                  : "No active premium expiry"}
              </span>
            </div>

            <div className="info-box">
              <p>Remaining Days</p>
              <span>
                {hasPremiumPlan(sellerPlan)
                  ? `${getRemainingDays(sellerPlan?.planExpiry)} days`
                  : "Upgrade required"}
              </span>
            </div>

            {!hasPremiumPlan(sellerPlan) && (
              <button type="button" className="secondary-btn" onClick={() => setUpgradeOpen(true)}>
                <Crown size={16} /> Upgrade to Premium
              </button>
            )}
          </div>

          <div className="settings-card">
            <h2><BadgeCheck size={16} /> Account Information</h2>

            <div className="form-grid">
              <div className="input-box">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>

              <div className="input-box">
                <label><Mail size={14} /> Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>

              <div className="input-box">
                <label><Phone size={14} /> Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              <div className="input-box">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div className="input-box">
                <label><Phone size={14} /> Payment Account Number</label>
                <input
                  type="text"
                  name="paymentAccountNumber"
                  value={formData.paymentAccountNumber}
                  onChange={handleChange}
                  placeholder="JazzCash / EasyPaisa account number"
                />
              </div>

              <div className="input-box">
                <label>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} />
              </div>

              <div className="input-box">
                <label><MapPin size={14} /> Region / City</label>
                <input type="text" name="region" value={formData.region} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2><Upload size={16} /> CNIC Documents</h2>

            <div className="doc-grid">
              <div className="doc-upload">
                <label>CNIC Front</label>
                {cnicFront ? (
                  <img src={cnicFront} alt="CNIC Front" className="doc-preview" />
                ) : (
                  <div className="doc-placeholder">No Image</div>
                )}
                <label className="upload-label">
                  <Upload size={16} />
                  Upload Front
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageChange(event, "cnicFront")}
                    hidden
                  />
                </label>
              </div>

              <div className="doc-upload">
                <label>CNIC Back</label>
                {cnicBack ? (
                  <img src={cnicBack} alt="CNIC Back" className="doc-preview" />
                ) : (
                  <div className="doc-placeholder">No Image</div>
                )}
                <label className="upload-label">
                  <Upload size={16} />
                  Upload Back
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageChange(event, "cnicBack")}
                    hidden
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2><Lock size={16} /> Security</h2>

            <div className="form-grid">
              <input
                type="password"
                placeholder="Current Password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              />
              <input
                type="password"
                placeholder="New Password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={loading}
              className="secondary-btn"
            >
              <Lock size={16} /> {loading ? "Changing..." : "Change Password"}
            </button>
          </div>

          <div className="save-row">
            <button type="button" onClick={handleSave} disabled={loading} className="save-btn">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {upgradeOpen && (
        <div className="upgrade-modal-backdrop">
          <section className="upgrade-modal">
            <button type="button" className="upgrade-close" onClick={() => setUpgradeOpen(false)}>
              <X size={18} />
            </button>

            <div className="upgrade-heading">
              <span><Crown size={14} /> Upgrade Your Plan</span>
              <h2>Choose the Perfect Plan</h2>
              <p>Unlock premium features and grow your business with advanced tools.</p>
            </div>

            <div className="upgrade-plan-grid">
              {plans.map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  className={`upgrade-plan-card ${selectedPlan === plan.id ? "selected" : ""} ${plan.featured ? "featured" : ""}`}
                  onClick={() => plan.id !== "free" && setSelectedPlan(plan.id)}
                >
                  {plan.featured && <em>Most Popular</em>}
                  <strong>{plan.title}</strong>
                  <small>{plan.note}</small>
                  <b>{plan.price}<span>/month</span></b>
                  <i>{plan.id === "free" ? "Current Plan" : `Upgrade to ${plan.title.replace(" Plan", "")}`}</i>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}><Check size={13} /> {feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {selectedPlan !== "free" && (
              <div className="payment-panel">
                <h3>Payment Method</h3>
                <div className="payment-method-grid">
                  {paymentMethods.map((method) => (
                    <button
                      type="button"
                      key={method}
                      className={paymentMethod === method ? "active" : ""}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {paymentMethod && (
                  <div className="payment-instructions">
                    <strong>Payment Number: {PAYMENT_NUMBER}</strong>
                    <p>Please send payment to this account number and upload your transaction screenshot.</p>
                  </div>
                )}

                <div className="payment-form-grid">
                  <label>
                    Selected Plan
                    <input value={selectedPlan} readOnly />
                  </label>
                  <label>
                    Payment Method
                    <input value={paymentMethod} readOnly />
                  </label>
                  <label>
                    Payment Number
                    <input value={PAYMENT_NUMBER} readOnly />
                  </label>
                  <label>
                    Transaction ID
                    <input
                      value={transactionId}
                      onChange={(event) => setTransactionId(event.target.value)}
                      placeholder="Enter transaction ID"
                    />
                  </label>
                </div>

                <label className="payment-upload">
                  <Upload size={16} />
                  {paymentScreenshot ? "Screenshot selected" : "Upload transaction screenshot"}
                  <input type="file" accept="image/*" hidden onChange={handlePaymentScreenshot} />
                </label>

                <button
                  type="button"
                  className="submit-payment-btn"
                  onClick={handleSubmitPayment}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Payment Record"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Settings;
