import { useEffect, useState } from "react";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { changePassword, updateProfile } from "../services/userApi";
import "./Page.css";
import "./Settings.css";

const settingsItems = [
  { id: "account", label: "Your Account" },
  { id: "appearance", label: "Appearance" },
  { id: "security", label: "Security" },
  { id: "feedback", label: "Feedback" },
  { id: "about", label: "About" },
];

function Settings({ onNavigate }) {
  const { user, saveUser, logout } = useAuth();
  const [activePanel, setActivePanel] = useState("account");
  const [mode, setMode] = useState(localStorage.getItem("themeMode") || "light");
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [feedback, setFeedback] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Save the selected theme so it stays after refresh.
    document.body.dataset.theme = mode;
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const resetMessages = () => {
    setStatus("");
    setError("");
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handlePasswordChange = (event) => {
    setPasswordData({
      ...passwordData,
      [event.target.name]: event.target.value,
    });
  };

  const handlePanelChange = (panelId) => {
    resetMessages();
    setActivePanel(panelId);
  };

  const handleProfileImageChange = (event) => {
    setProfilePic(event.target.files[0] || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData();

    // FormData lets us send text fields and an optional image together.
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (profilePic) data.append("profilePic", profilePic);

    try {
      resetMessages();
      const updatedUser = await updateProfile(data);
      saveUser({ ...user, ...updatedUser, token: localStorage.getItem("token") });
      setProfilePic(null);
      setStatus("Account settings saved.");
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    try {
      resetMessages();
      const result = await changePassword(passwordData);
      setPasswordData({ currentPassword: "", newPassword: "" });
      setStatus(result.message);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFeedbackSubmit = (event) => {
    event.preventDefault();
    resetMessages();
    setFeedback("");
    setStatus("Thanks for the feedback.");
  };

  const handleLogout = () => {
    if (window.confirm("Log out of Instant?")) logout();
  };

  const renderPanel = () => {
    if (activePanel === "appearance") {
      return (
        <div className="settings-panel-card">
          <h2>Appearance</h2>
          <p>Choose how Instant looks on this device.</p>
          <div className="mode-grid">
            {["light", "dark", "purple"].map((item) => (
              <button
                key={item}
                className={mode === item ? "active" : ""}
                onClick={() => setMode(item)}
                type="button"
              >
                <span className={`mode-preview ${item}`} />
                <strong>{item[0].toUpperCase() + item.slice(1)}</strong>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activePanel === "security") {
      return (
        <div className="settings-panel-card">
          <h2>Security</h2>
          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            <label>
              Current password
              <input
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <label>
              New password
              <input
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <button className="primary-button" type="submit">Change password</button>
          </form>
          <div className="security-logout">
            <button className="logout-button" type="button" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      );
    }

    if (activePanel === "feedback") {
      return (
        <div className="settings-panel-card">
          <h2>Feedback</h2>
          <form className="settings-form" onSubmit={handleFeedbackSubmit}>
            <label>
              Message
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows="5"
                required
              />
            </label>
            <button className="outline-button" type="submit">Send feedback</button>
          </form>
        </div>
      );
    }

    if (activePanel === "about") {
      return (
        <div className="settings-panel-card">
          <h2>About</h2>
          <p>Instant is a simple MERN social media project with posts, follows, bookmarks, profiles, and direct messages.</p>
          <div className="about-list">
            <span>MongoDB</span>
            <span>Express</span>
            <span>React</span>
            <span>Node</span>
          </div>
        </div>
      );
    }

    return (
      <div className="settings-panel-card">
        <h2>Your Account</h2>
        <button className="settings-profile-shortcut" onClick={() => onNavigate("profile", user.username)}>
          <UserAvatar as="span" className="avatar" user={user} />
          <span>
            <strong>{user.name}</strong>
            <small>@{user.username}</small>
          </span>
        </button>
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label>
            Username
            <input name="username" value={formData.username} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label>
            Bio
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" />
          </label>
          <label>
            Profile image
            <input type="file" accept="image/*" onChange={handleProfileImageChange} />
          </label>
          <button className="primary-button" type="submit">Save account</button>
        </form>
      </div>
    );
  };

  return (
    <section className="page-content">
      <div className="page-title"><h1>Settings</h1></div>

      <div className="settings-layout">
        <nav className="settings-menu" aria-label="Settings sections">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              className={activePanel === item.id ? "active" : ""}
              onClick={() => handlePanelChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {renderPanel()}
          {(status || error) && (
            <div className="settings-message">
              {status && <p className="success-message">{status}</p>}
              {error && <p className="error-message">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Settings;
