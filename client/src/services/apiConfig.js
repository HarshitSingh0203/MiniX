export const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // Full URLs can be used directly. Uploaded files need the server URL first.
  if (imagePath.startsWith("http")) return imagePath;
  return `${SERVER_URL}/${imagePath}`;
};

export const getProfilePicPath = (person) => {
  // Support old and new profile image field names.
  return person?.profilePic || person?.profilePhoto || person?.avatar || "";
};

export const getProfileImageUrl = (person) => {
  return getImageUrl(getProfilePicPath(person));
};

export const getFallbackProfileImageUrl = (person) => {
  // ui-avatars creates a simple image when the user has no uploaded photo.
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    person?.name || "User"
  )}&background=5b2cff&color=fff`;
};

export const getProfileAvatarUrl = (person) => {
  return getProfileImageUrl(person) || getFallbackProfileImageUrl(person);
};
