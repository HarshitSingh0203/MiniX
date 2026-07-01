/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../services/authApi";

const AuthContext = createContext();

const normalizeUser = (userData, fallbackToken = localStorage.getItem("token")) => {
  if (!userData) return null;

  // Older data may use different names for the same profile picture.
  const profilePic = userData.profilePic || userData.profilePhoto || userData.avatar || "";
  const token = userData.token || fallbackToken || "";

  return {
    ...userData,
    profilePic,
    token,
  };
};

const getSavedUser = () => {
  const savedUser = localStorage.getItem("user");

  if (!savedUser) return null;

  try {
    return normalizeUser(JSON.parse(savedUser));
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  const saveUser = (userData) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem("token", normalizedUser.token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let ignore = false;

    getCurrentUser()
      .then((currentUser) => {
        if (!ignore) saveUser({ ...currentUser, token });
      })
      .catch(() => {
        if (!ignore) logout();
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
