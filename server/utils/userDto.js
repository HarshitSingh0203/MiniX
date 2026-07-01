const profileSelect = "name username profilePic bannerImage createdAt +profilePhoto +avatar";

const resolveProfilePic = (user) => {
  if (!user) return "";

  return user.profilePic || user.profilePhoto || user.avatar || "";
};

const formatPublicUser = (user) => {
  if (!user) return null;

  // Keep only safe public fields. Do not send password data to the client.
  const publicUser = {
    _id: user._id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    profilePic: resolveProfilePic(user),
    bannerImage: user.bannerImage || "",
    createdAt: user.createdAt,
    followers: user.followers,
    following: user.following,
  };

  if (user.email) {
    publicUser.email = user.email;
  }

  return publicUser;
};

const formatAuthUser = (user, token) => {
  const authUser = {
    ...formatPublicUser(user),
    email: user.email,
    bookmarks: user.bookmarks,
  };

  if (token) {
    authUser.token = token;
  }

  return authUser;
};

const formatPost = (post) => {
  const item = typeof post.toObject === "function" ? post.toObject() : post;
  let repostOf = null;

  if (item.repostOf) {
    repostOf = {
      ...item.repostOf,
      user: formatPublicUser(item.repostOf.user),
      comments: formatComments(item.repostOf.comments),
    };
  }

  return {
    ...item,
    user: formatPublicUser(item.user),
    repostOf,
    comments: formatComments(item.comments),
  };
};

const formatComments = (comments = []) => {
  return comments.map((comment) => ({
    ...comment,
    user: formatPublicUser(comment.user),
  }));
};

module.exports = {
  formatAuthUser,
  formatPost,
  formatPublicUser,
  profileSelect,
  resolveProfilePic,
};
