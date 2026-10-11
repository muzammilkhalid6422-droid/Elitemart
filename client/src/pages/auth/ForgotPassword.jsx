import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { requestPasswordResetOtp, resetPassword } from "../../services/authService";
import { splitBrandName, useBranding } from "../../context/BrandingContext";
import "./Login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const brandName = splitBrandName(branding.marketplaceName);

  const [step, setStep] = useState("email");
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!formData.email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordResetOtp({
        email: formData.email,
      });

      if (response.data?.devOtp) {
        // Dev mode: email delivery failed, auto-fill OTP for testing
        setFormData((prev) => ({ ...prev, otp: String(response.data.devOtp) }));
        setMessageType("success");
        setMessage(`Dev Mode: Email delivery failed. OTP auto-filled: ${response.data.devOtp}`);
      } else {
        setMessageType("success");
        setMessage(response.data?.message || "Password reset OTP has been sent.");
      }
      setStep("reset");
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessageType("error");
      setMessage(error.response?.data?.message || "Could not send reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!formData.otp.trim() || !formData.password.trim()) {
      setMessageType("error");
      setMessage("Please enter OTP and new password.");
      return;
    }

    if (formData.password.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessageType("error");
      setMessage("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
      });

      setMessageType("success");
      setMessage(response.data?.message || "Password has been reset successfully.");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      console.error("Reset password error:", error);
      setMessageType("error");
      setMessage(error.response?.data?.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-wrapper forgot-wrapper">
        <section className="login-brand-panel forgot-brand-panel">
          <div className="login-brand-content">
            <div className="brand-logo-container">
              <KeyRound size={54} />
              <ShieldCheck size={32} className="brand-crown" />
            </div>

            <div>
              <h1 className="brand-title">
                {brandName.primary}
                <span>{brandName.accent}</span>
              </h1>
              <p className="brand-tagline">Secure Account Recovery</p>
            </div>

            <div className="brand-copy">
              <h2>Reset your password safely.</h2>
              <p>Use the OTP sent to your registered email to create a new password.</p>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-card">
            <Link to="/login" className="forgot-back-link">
              <ArrowLeft size={16} />
              Back to login
            </Link>

            <p className="login-kicker">Account recovery</p>
            <h2 className="login-title">Forgot Password</h2>
            <p className="login-subtitle">
              {step === "email"
                ? "Enter your account email to receive a reset OTP."
                : "Enter the OTP from your email and choose a new password."}
            </p>

            {message && <p className={`auth-message ${messageType}`}>{message}</p>}

            {step === "email" ? (
              <form onSubmit={handleRequestOtp} className="login-form">
                <label className="input-group">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </label>

                <button type="submit" className="login-btn" disabled={loading}>
                  <span>{loading ? "Sending..." : "Send OTP"}</span>
                  <ArrowRight size={19} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="login-form">
                <label className="input-group">
                  <ShieldCheck size={18} />
                  <input
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    placeholder="OTP code"
                    value={formData.otp}
                    onChange={handleChange}
                  />
                </label>

                <label className="input-group">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="password"
                    placeholder="New password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </label>

                <label className="input-group">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </label>

                <button type="submit" className="login-btn" disabled={loading}>
                  <span>{loading ? "Resetting..." : "Reset Password"}</span>
                  <ArrowRight size={19} />
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;
