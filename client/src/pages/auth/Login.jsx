import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Crown,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  Zap,
  Shield,
} from "lucide-react";
import { loginUser, loginWithGoogle } from "../../services/authService";
import { clearAuthSession, getActiveAuthUser, saveAuthSession } from "../../utils/authSession";
import { splitBrandName, useBranding } from "../../context/BrandingContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const brandName = splitBrandName(branding.marketplaceName);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      const user = getActiveAuthUser();
      const token = localStorage.getItem("token");

      if (token && user?.role === "seller") {
        navigate("/seller/dashboard", { replace: true });
      } else if (token && user?.role === "user") {
        navigate("/home", { replace: true });
      }
    } catch {
      clearAuthSession();
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const finishLogin = (user, token) => {
    saveAuthSession(user, token);

    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "seller") {
      navigate("/seller/dashboard");
    } else {
      navigate("/home");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password) {
      setMessageType("error");
      return setMessage("Please enter your email and password.");
    }

    setLoading(true);

    try {
      const response = await loginUser(formData);

      setMessageType("success");
      setMessage("Login successful.");
      finishLogin(response.data.user, response.data.token);
    } catch (error) {
      console.error("Login Error:", error);
      setMessageType("error");
      setMessage(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleScript = () =>
    new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const existingScript = document.querySelector("script[data-google-identity]");
      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

  const handleGoogleLogin = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setMessageType("error");
      setMessage("Google login ke liye VITE_GOOGLE_CLIENT_ID set karein.");
      return;
    }

    setGoogleLoading(true);
    setMessage("");

    try {
      await loadGoogleScript();

      const accessToken = await new Promise((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }

            resolve(response.access_token);
          },
        });

        tokenClient.requestAccessToken({ prompt: "select_account" });
      });

      const response = await loginWithGoogle({ accessToken });
      setMessageType("success");
      setMessage("Google login successful.");
      finishLogin(response.data.user, response.data.token);
    } catch (error) {
      console.error("Google Login Error:", error);
      setMessageType("error");
      setMessage(error.response?.data?.message || "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="login-page">
      <button type="button" className="login-language" aria-label="Select language">
        <Globe2 size={16} />
        English
        <ChevronDown size={15} />
      </button>

      <div className="login-wrapper">
        <section className="login-brand-panel">
          <div className="login-brand-content">
            <div className="brand-logo-container">
              <ShoppingBag size={54} />
              <Crown size={32} className="brand-crown" />
            </div>

            <div>
              <h1 className="brand-title">
                {brandName.primary}
                <span>{brandName.accent}</span>
              </h1>
              <p className="brand-tagline">Premium Shopping Experience</p>
            </div>

            <div className="brand-divider">
              <i />
              <Crown size={18} />
              <i />
            </div>

            <div className="brand-copy">
              <h2>Premium Class. Trusted Business.</h2>
              <p>Join {branding.marketplaceName} and grow your business with trust, speed & security.</p>
            </div>

            <div className="brand-features">
              <div className="feature-item">
                <Shield size={20} />
                <span>Premium Sellers</span>
              </div>
              <div className="feature-item">
                <Trophy size={20} />
                <span>Verified Business</span>
              </div>
              <div className="feature-item">
                <Zap size={20} />
                <span>Fast & Reliable Delivery</span>
              </div>
              <div className="feature-item">
                <Lock size={20} />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-card">
            <p className="login-kicker">User or seller</p>
            <h2 className="login-title">Welcome Back! <Crown size={26} /></h2>
            <p className="login-subtitle">
              Sign in to access your {branding.marketplaceName} account
            </p>
            <div className="seller-approval-hint">
              <ShieldCheck size={18} />
              <span>Seller accounts open after admin approval.</span>
              <ArrowRight size={15} />
            </div>

            {message && <p className={`auth-message ${messageType}`}>{message}</p>}

            <form onSubmit={handleLogin} className="login-form">
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

              <label className="input-group">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </label>

              <Link to="/register" className="forgot-link">Forgot Password?</Link>

              <button type="submit" className="login-btn" disabled={loading}>
                <span>{loading ? "Signing in..." : "Login"}</span>
                <ArrowRight size={19} />
              </button>
            </form>

            <div className="login-divider">
              <i />
              <span>Or continue with</span>
              <i />
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <span>G</span>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            <p className="login-bottom-link">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
