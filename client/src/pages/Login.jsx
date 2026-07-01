import { useState } from "react";
import { loginUser } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Login({ onSwitch, onSuccess }) {
  const { saveUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Send the email and password to the backend, then save the returned user.
      const data = await loginUser({ email, password });
      saveUser(data);
      onSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="logo">Instant</div>
      <h1>Welcome back</h1>
      <p className="subtitle">Log in to Instant</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="switch-text">
        New to Instant?{" "}
        <button className="link-button" type="button" onClick={() => onSwitch("register")}>
          Create an account
        </button>
      </p>
    </div>
  );
}

export default Login;
