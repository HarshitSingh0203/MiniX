import { SERVER_URL } from "./apiConfig";

const API_URL = `${SERVER_URL}/api/chat`;

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };

  // Chat routes are private, so they need the login token.
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Something went wrong");
  return result;
};

export const getConversations = () => request("/conversations");
export const startConversation = (recipientId) =>
  request("/conversations", {
    method: "POST",
    body: JSON.stringify({ recipientId }),
  });
export const sendMessage = (conversationId, text) =>
  request(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
