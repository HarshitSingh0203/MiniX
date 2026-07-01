import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/shared.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Start the React app and give every page access to logged-in user data.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
