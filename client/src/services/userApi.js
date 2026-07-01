import { SERVER_URL } from "./apiConfig";

const API_URL = `${SERVER_URL}/api/users`;

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };

  // Protected user routes need the token in the Authorization header.
  if (token) headers.Authorization = `Bearer ${token}`;

  // Do not set JSON headers for image uploads.
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Something went wrong");
  return result;
};

export const getUser = (username) => request(`/${username}`);
export const searchUsers = (query) => request(`/search?q=${encodeURIComponent(query)}`);
export const toggleFollow = (userId) => request(`/${userId}/follow`, { method: "PUT" });
export const updateProfile = (formData) =>
  request("/profile/update", { method: "PUT", body: formData });
export const changePassword = (passwordData) =>
  request("/password", { method: "PUT", body: JSON.stringify(passwordData) });
