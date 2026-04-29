import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { getProfile, updateProfile } from "../../services/authService";
import "./Profile.css";

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 800;

const defaultAvatar =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=800&auto=format&fit=crop";

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to process image"));
    };

    image.src = imageUrl;
  });

const compressAvatar = async (file) => {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(image.width, image.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.85);
};

const buildCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return {
    question: `${a} + ${b} = ?`,
    answer: String(a + b),
    a,
    b,
  };
};

const Profile = () => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
    avatar: "",
    captchaInput: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [captcha, setCaptcha] = useState(buildCaptcha);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const previewPassword = useMemo(() => "Saved securely in backend", []);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      try {
        const response = await getProfile();
        const user = response.data.user;

        if (!ignore) {
          setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            currentPassword: "",
            password: "",
            confirmPassword: "",
            avatar: user.avatar || "",
            captchaInput: "",
          });
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (error) {
        if (!ignore) setMessage(error.response?.data?.message || "Unable to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      const msg = "Profile image is too large";
      setMessage(msg);
      alert(msg);
      event.target.value = "";
      return;
    }

    try {
      const avatar = await compressAvatar(file);
      setForm((current) => ({ ...current, avatar }));
      setMessage("");
    } catch {
      const msg = "Unable to process profile image";
      setMessage(msg);
      alert(msg);
    }

    event.target.value = "";
  };

  const handleSave = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      setMessage("New password and confirm password do not match");
      return;
    }

    if (form.captchaInput.trim() !== captcha.answer) {
      const msg = "Captcha is incorrect";
      setMessage(msg);
      setCaptcha(buildCaptcha());
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        currentPassword: form.currentPassword,
        password: form.password,
        avatar: form.avatar,
      });
      const updatedUser = response.data.user;

      setForm({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
        avatar: updatedUser.avatar || "",
        captchaInput: "",
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setEditing(false);
      setCaptcha(buildCaptcha());
      setMessage(response.data.message || "Profile updated successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setEditing(false);
    setMessage("");
    setCaptcha(buildCaptcha());

    try {
      const response = await getProfile();
      const user = response.data.user;

      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
        avatar: user.avatar || "",
        captchaInput: "",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setMessage("We'll send you instructions to reset it.");
  };

  const Field = ({ icon: Icon, label, name, placeholder, type = "text", disabled = !editing }) => (
    <label className="profile-field">
      <span>{label}</span>
      <div>
        <Icon size={18} />
        <input
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    </label>
  );

  const PasswordField = ({ label, name, placeholder, visible, onToggle, disabled = !editing }) => (
    <label className="profile-field">
      <span>{label}</span>
      <div>
        <Lock size={18} />
        <input
          name={name}
          type={visible ? "text" : "password"}
          value={form[name]}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
        />
        <button type="button" onClick={onToggle} disabled={disabled}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <header className="profile-title">
          <h1>
            Profile<span>.</span>
          </h1>
          <p>Manage your account information and security</p>
        </header>

        {message && <div className="profile-message">{message}</div>}

        {loading ? (
          <div className="profile-loading">Loading profile...</div>
        ) : (
          <section className="profile-card">
            <div className="profile-hero">
              <div className="profile-avatar-block">
                <div className="profile-avatar-ring">
                  <img src={form.avatar || defaultAvatar} alt={form.name || "Profile"} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!editing}
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>

                <div>
                  <h2>
                    {form.name || "User"}
                    <CheckCircle2 size={18} />
                  </h2>
                  <p>{form.email}</p>
                  <span>
                    <i />
                    Live account connected with backend
                  </span>
                </div>
              </div>

              <div className="profile-actions">
                {!editing ? (
                  <button type="button" onClick={() => setEditing(true)}>
                    <Pencil size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={handleCancel}>
                      <X size={16} />
                      Cancel
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving}>
                      <Save size={16} />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-content">
              <section className="profile-section">
                <h3>
                  <User size={18} />
                  Personal Information
                </h3>
                <div className="profile-grid">
                  <Field icon={User} label="Full Name" name="name" placeholder="Full name" />
                  <Field icon={Mail} label="Email Address" name="email" placeholder="Email" />
                  <Field icon={User} label="Phone Number" name="phone" placeholder="Phone number" />
                  <label className="profile-field">
                    <span>Account Status</span>
                    <div>
                      <ShieldCheck size={18} />
                      <input value="Saved securely in backend" disabled />
                      <CheckCircle2 size={16} />
                    </div>
                  </label>
                </div>
              </section>

              <section className="profile-section security">
                <h3>
                  <Lock size={18} />
                  Security
                </h3>
                <div className="profile-grid">
                  <PasswordField
                    label="Current Password"
                    name="currentPassword"
                    placeholder={previewPassword}
                    visible={showCurrent}
                    onToggle={() => setShowCurrent((current) => !current)}
                  />
                  <PasswordField
                    label="New Password"
                    name="password"
                    placeholder="Enter new password"
                    visible={showNew}
                    onToggle={() => setShowNew((current) => !current)}
                  />
                  <PasswordField
                    label="Confirm New Password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((current) => !current)}
                  />
                  <button
                    type="button"
                    className="profile-forgot"
                    onClick={handleForgotPassword}
                    disabled={!editing}
                  >
                    <span>Forgot Password?</span>
                    <small>We'll send you instructions to reset it.</small>
                  </button>
                </div>
              </section>

              <section className="profile-captcha-row">
                <label className="profile-field captcha-input">
                  <span>Captcha: {captcha.question}</span>
                  <div>
                    <Sparkles size={18} />
                    <input
                      name="captchaInput"
                      value={form.captchaInput}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter captcha answer"
                    />
                  </div>
                </label>

                <div className="profile-captcha-display">
                  <strong>{captcha.a}</strong>
                  <span>+</span>
                  <strong>{captcha.b}</strong>
                  <span>=</span>
                  <strong>?</strong>
                  <button
                    type="button"
                    onClick={() => setCaptcha(buildCaptcha())}
                    disabled={!editing}
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </section>

              <button
                type="button"
                className="profile-save-wide"
                onClick={editing ? handleSave : () => setEditing(true)}
                disabled={saving}
              >
                <ShieldCheck size={18} />
                {editing ? (saving ? "Saving..." : "Save Changes") : "Edit Profile"}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

export default Profile;
