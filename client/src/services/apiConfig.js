export const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${SERVER_URL}/${imagePath}`;
};
