import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/userApi";
import "./Page.css";
import "./Settings.css";

function Settings() {
  const { user, saveUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (profilePic) data.append("profilePic", profilePic);

    try {
      setError("");
      const updatedUser = await updateProfile(data);
      saveUser({ ...user, ...updatedUser, token: localStorage.getItem("token") });
      setProfilePic(null);
      setStatus("Settings saved.");
    } catch (error) {
      setStatus("");
      setError(error.message);
    }
  };

  return (
    <section className="page-content">
      <div className="page-title"><h1>Settings</h1></div>

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
          Profile photo
          <input type="file" accept="image/*" onChange={(event) => setProfilePic(event.target.files[0] || null)} />
        </label>

        {status && <p className="success-message">{status}</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="settings-actions">
          <button className="primary-button" type="submit">Save changes</button>
          <button className="outline-button" type="button" onClick={logout}>Log out</button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
