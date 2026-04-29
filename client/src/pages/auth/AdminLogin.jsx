import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginAdmin } from "../../services/authService";
import "./AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("adminToken")) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleAdminChange = (event) => {
    const { name, value } = event.target;
    setAdminData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!adminData.username || !adminData.password) {
      setMessageType("error");
      return setMessage("Please fill all fields.");
    }

    setLoading(true);

    try {
      const response = await loginAdmin(adminData);

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminUser", JSON.stringify(response.data.admin));

      setMessageType("success");
      setMessage("Admin login successful.");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin Login Error:", error);
      setMessageType("error");
      setMessage(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-lamp-page">
      <input type="checkbox" id="admin-lamp-switch" className="admin-lamp-switch" />
      <div className="admin-bg-overlay" />

      <div className="admin-lamp-container">
        <section className="admin-lamp-box" aria-label="Admin login lamp">
          <div className="admin-lamp-body-parts">
            <div className="admin-lamp-head">
              <div className="admin-lamp-face">
                <div className="admin-lamp-eye" />
                <div className="admin-lamp-eye" />
                <div className="admin-lamp-mouth" />
              </div>
            </div>
            <div className="admin-lamp-base" />
          </div>

          <label htmlFor="admin-lamp-switch" className="admin-pull-string" />
          <div className="admin-click-guide">Click to Login</div>
        </section>

        <section className="admin-login-card">
          <h1>Admin Access</h1>
          <p className="admin-login-sub">Sign in to control your marketplace</p>

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <input
              type="text"
              name="username"
              placeholder="Admin username"
              value={adminData.username}
              onChange={handleAdminChange}
            />

            <div className="admin-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Admin password"
                value={adminData.password}
                onChange={handleAdminChange}
              />
              <button
                type="button"
                className="admin-eye-btn"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="admin-signin-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {message && <p className={`admin-login-msg ${messageType}`}>{message}</p>}

          <div className="admin-link-text">
            Not admin? <Link to="/login">User Login</Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminLogin;
