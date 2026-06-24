import { SERVER_URL } from "./apiConfig";

const API_URL = `${SERVER_URL}/api/auth`;

const sendRequest = async (endpoint, data) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong");
  }

  return result;
};

export const registerUser = (userData) => {
  return sendRequest("/register", userData);
};

export const loginUser = (userData) => {
  return sendRequest("/login", userData);
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Could not get user");
  return result;
};
