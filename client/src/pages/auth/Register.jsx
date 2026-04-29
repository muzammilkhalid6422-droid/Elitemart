import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Building2,
  Crown,
  Eye,
  EyeOff,
  Globe2,
  ImageIcon,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerSeller, registerUser } from "../../services/authService";
import { splitBrandName, useBranding } from "../../context/BrandingContext";
import { saveAuthSession } from "../../utils/authSession";
import "./Register.css";

const emptyAccount = {
  name: "",
  email: "",
  phone: "",
  password: "",
  country: "",
  region: "",
  avatar: "",
};

const emptySeller = {
  companyName: "",
  paymentAccountNumber: "",
  cnicFront: "",
  cnicBack: "",
};

const Register = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const brandName = splitBrandName(branding.marketplaceName);
  const [step, setStep] = useState("role");
  const [accountData, setAccountData] = useState(emptyAccount);
  const [sellerData, setSellerData] = useState(emptySeller);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setNotice = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleAccountChange = (event) => {
    const { name, value } = event.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSellerChange = (event) => {
    const { name, value } = event.target;
    setSellerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === "avatar") {
        setAccountData((prev) => ({ ...prev, avatar: reader.result }));
      } else {
        setSellerData((prev) => ({ ...prev, [type]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForStep = (nextStep) => {
    setMessage("");
    setMessageType("error");
    setStep(nextStep);
  };

  const validateCommonFields = () => {
    const required = ["name", "email", "phone", "password", "country", "region"];
    return required.every((field) => String(accountData[field] || "").trim());
  };

  const handleUserRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateCommonFields()) {
      return setNotice("Please complete name, email, phone, password, country and region.");
    }

    setLoading(true);

    try {
      const response = await registerUser(accountData);

      saveAuthSession(response.data.user, response.data.token);
      setNotice(response.data.message || "Registration successful.", "success");
      navigate("/home");
    } catch (error) {
      setNotice(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSellerRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    if (
      !validateCommonFields() ||
      !sellerData.companyName ||
      !sellerData.paymentAccountNumber ||
      !sellerData.cnicFront ||
      !sellerData.cnicBack
    ) {
      return setNotice("Please complete seller details, payment account number and upload both CNIC images.");
    }

    setLoading(true);

    try {
      const response = await registerSeller({
        ...accountData,
        ...sellerData,
      });

      setAccountData(emptyAccount);
      setSellerData(emptySeller);
      setNotice(
        response.data.message || "Seller account submitted. You can login after admin approval.",
        "success"
      );
      setStep("role");
    } catch (error) {
      setNotice(error.response?.data?.message || "Seller registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderBrandPanel = (title, subtitle) => (
    <section className="auth-brand-panel">
      <div className="register-brand-lockup">
        <div className="register-logo-tile">
          <ShoppingBasket size={42} />
          <Crown size={22} />
        </div>
        <h1>
          {brandName.primary}
          <span>{brandName.accent}</span>
        </h1>
        <p>Premium Marketplace</p>
        <div className="register-brand-line">
          <i />
          <Crown size={14} />
          <i />
        </div>
      </div>

      <div className="auth-brand-copy">
        <h2>{title}</h2>
        <h3>{subtitle}</h3>
      </div>

      <div className="register-brand-perks">
        <article>
          <ShieldCheck size={18} />
          <div>
            <strong>Premium Visibility</strong>
            <span>Get featured and reach more potential customers.</span>
          </div>
        </article>
        <article>
          <Zap size={18} />
          <div>
            <strong>Fast & Reliable</strong>
            <span>Lightning fast delivery and dedicated support.</span>
          </div>
        </article>
        <article>
          <BadgeCheck size={18} />
          <div>
            <strong>Secure & Trusted</strong>
            <span>Your business and payments are always secure.</span>
          </div>
        </article>
        <article>
          <BarChart3 size={18} />
          <div>
            <strong>Business Growth</strong>
            <span>Powerful tools and insights to grow your store.</span>
          </div>
        </article>
      </div>

      <div className="register-brand-note">
        <Crown size={18} />
        <strong>Premium Class. Trusted Business.</strong>
        <span>Be a part of {branding.marketplaceName} and experience a higher standard of success.</span>
      </div>
    </section>
  );

  const renderMessage = () =>
    message ? <p className={`register-message ${messageType}`}>{message}</p> : null;

  const renderUpload = (label, type, value) => (
    <div className="register-document-upload">
      <span>{label}</span>
      <div className="document-preview">
        {value ? <img src={value} alt={label} /> : <ImageIcon size={28} />}
      </div>
      <label className="upload-label">
        <Upload size={16} />
        Upload
        <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, type)} hidden />
      </label>
    </div>
  );

  const renderCommonFields = () => (
    <>
      <div className="register-avatar-section">
        <div className="avatar-preview">
          {accountData.avatar ? <img src={accountData.avatar} alt="Profile" /> : <ImageIcon size={32} />}
        </div>
        <label className="upload-label">
          <Upload size={16} />
          Profile Photo
          <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, "avatar")} hidden />
        </label>
      </div>

      <label className="register-input-group">
        <span>Full Name</span>
        <User size={18} />
        <input type="text" name="name" placeholder="Full name" value={accountData.name} onChange={handleAccountChange} />
      </label>

      <label className="register-input-group">
        <span>Email Address</span>
        <Mail size={18} />
        <input type="email" name="email" placeholder="Email address" value={accountData.email} onChange={handleAccountChange} />
      </label>

      <label className="register-input-group">
        <span>Contact Number</span>
        <Phone size={18} />
        <input type="tel" name="phone" placeholder="Phone number" value={accountData.phone} onChange={handleAccountChange} />
      </label>

      <label className="register-input-group">
        <span>Country</span>
        <Globe2 size={18} />
        <input type="text" name="country" placeholder="Country" value={accountData.country} onChange={handleAccountChange} />
      </label>

      <label className="register-input-group">
        <span>Residential Address</span>
        <MapPin size={18} />
        <input type="text" name="region" placeholder="Region / city" value={accountData.region} onChange={handleAccountChange} />
      </label>

      <label className="register-input-group">
        <span>Security Password</span>
        <Lock size={18} />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={accountData.password}
          onChange={handleAccountChange}
        />
        <button type="button" className="register-eye-btn" onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>
    </>
  );

  if (step === "role") {
    return (
      <main className="register-page">
        <div className="register-wrapper">
          {renderBrandPanel("Grow Your Business", `With ${branding.marketplaceName}`)}

          <section className="register-form-panel">
            <p className="register-kicker">Account type</p>
            <h2 className="register-title">Create Your Account</h2>
            {renderMessage()}

            <div className="register-role-buttons">
              <button type="button" className="role-btn" onClick={() => resetForStep("user")}>
                <User size={34} />
                <span>Customer</span>
                <small>Shop with a personal account</small>
              </button>
              <button type="button" className="role-btn" onClick={() => resetForStep("seller")}>
                <Building2 size={34} />
                <span>Seller</span>
                <small>Submit documents for admin approval</small>
              </button>
            </div>

            <p className="register-bottom-link">
              Already registered? <Link to="/login">Login</Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  const isSeller = step === "seller";

  return (
    <main className="register-page">
      <div className="register-wrapper wide">
        {renderBrandPanel(
          isSeller ? "Grow Your Business" : "Premium Shopping",
          isSeller ? `With ${branding.marketplaceName}` : `Join ${branding.marketplaceName}`
        )}

        <section className="register-form-panel">
          <button type="button" className="back-btn" onClick={() => resetForStep("role")}>
            <ArrowLeft size={17} />
            Back
          </button>

          <p className="register-kicker">{isSeller ? "Seller account" : "Customer account"}</p>
          <h2 className="register-title">
            Create Your <span>{isSeller ? "Seller" : "Customer"}</span> Account
          </h2>
          <p className="register-subtitle">
            Fill in the details below to get started.
          </p>
          {renderMessage()}

          <form onSubmit={isSeller ? handleSellerRegister : handleUserRegister} className="register-form">
            {renderCommonFields()}

            {isSeller && (
              <>
                <label className="register-input-group">
                  <span>Store Name</span>
                  <Building2 size={18} />
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Store / company name"
                    value={sellerData.companyName}
                    onChange={handleSellerChange}
                  />
                </label>

                <label className="register-input-group">
                  <span>Bank Account / JazzCash / EasyPaisa</span>
                  <Phone size={18} />
                  <input
                    type="tel"
                    name="paymentAccountNumber"
                    placeholder="JazzCash / EasyPaisa account number"
                    value={sellerData.paymentAccountNumber}
                    onChange={handleSellerChange}
                  />
                </label>

                <div className="seller-doc-grid">
                  {renderUpload("CNIC front", "cnicFront", sellerData.cnicFront)}
                  {renderUpload("CNIC back", "cnicBack", sellerData.cnicBack)}
                </div>

                <div className="approval-note">
                  <ShieldCheck size={18} />
                  Seller login unlocks after admin approval.
                </div>
              </>
            )}

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Submitting..." : isSeller ? "Submit for Approval" : "Create Account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Register;
