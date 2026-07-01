import { getProfileAvatarUrl } from "../services/apiConfig";

function UserAvatar({
  as = "img",
  className = "",
  user,
  alt,
  onClick,
  title,
}) {
  const imageClassName = "user-avatar-image";

  // Build the same avatar image, then wrap it differently when needed.
  const image = (
    <img
      className={imageClassName}
      src={getProfileAvatarUrl(user)}
      alt={alt || user?.name || "Profile"}
    />
  );

  // Use a button avatar when the avatar should be clickable.
  if (as === "button") {
    return (
      <button className={className} type="button" onClick={onClick} title={title}>
        {image}
      </button>
    );
  }

  // Use a span when the parent is already a clickable button.
  if (as === "span") {
    return (
      <span className={className} title={title}>
        {image}
      </span>
    );
  }

  return (
    <img
      className={`${className} ${imageClassName}`.trim()}
      src={getProfileAvatarUrl(user)}
      alt={alt || user?.name || "Profile"}
      title={title}
    />
  );
}

export default UserAvatar;
