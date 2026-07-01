import { SERVER_URL } from "./apiConfig";

const API_URL = `${SERVER_URL}/api/posts`;

const request = async (endpoint = "", options = {}) => {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };

  // Add the login token when the user is signed in.
  if (token) headers.Authorization = `Bearer ${token}`;

  // FormData sets its own content type, so only JSON needs this header.
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Something went wrong");
  return result;
};

export const getAllPosts = () => request();
export const getFeedPosts = () => request("/feed");
export const getExploreData = () => request("/explore");
export const getBookmarkedPosts = () => request("/bookmarks");
export const getPostsByUser = (username) => request(`/user/${username}`);
export const searchPosts = (query) => request(`/search?q=${encodeURIComponent(query)}`);
export const createPost = (formData) => request("", { method: "POST", body: formData });
export const toggleLike = (postId) => request(`/${postId}/like`, { method: "PUT" });
export const toggleBookmark = (postId) => request(`/${postId}/bookmark`, { method: "PUT" });
export const toggleRepost = (postId) => request(`/${postId}/repost`, { method: "PUT" });
export const addComment = (postId, text) =>
  request(`/${postId}/comment`, { method: "POST", body: JSON.stringify({ text }) });
export const deletePost = (postId) => request(`/${postId}`, { method: "DELETE" });
