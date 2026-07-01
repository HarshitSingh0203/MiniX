const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { formatAuthUser, formatPublicUser } = require("../utils/userDto");

const getUserByUsername = async (req, res) => {
  try {
    // Find one user by username and hide the password field.
    const user = await User.findOne({ username: req.params.username })
      .select("-password +profilePhoto +avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(formatPublicUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    // A user should not be able to follow their own account.
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = isFollowing(currentUser, userToFollow._id);

    if (alreadyFollowing) {
      currentUser.following.pull(userToFollow._id);
      userToFollow.followers.pull(currentUser._id);
    } else {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({
      message: alreadyFollowing ? "User unfollowed" : "User followed",
      following: currentUser.following,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user id" });
    }
    res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.json([]);
    }

    const safeQuery = escapeRegex(query);
    const users = await User.find({
      $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { username: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .select("name username bio profilePic bannerImage followers following createdAt +profilePhoto +avatar")
      .limit(20);

    res.json(users.map(formatPublicUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, username, email, bio } = req.body || {};

    // Only update fields that were sent from the form.
    if (name !== undefined) user.name = name;
    if (username !== undefined) user.username = username.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (bio !== undefined) user.bio = bio;
    if (req.file) user.profilePic = `uploads/${req.file.filename}`;
    if (req.files?.profilePic?.[0]) {
      user.profilePic = `uploads/${req.files.profilePic[0].filename}`;
    }
    if (req.files?.bannerImage?.[0]) {
      user.bannerImage = `uploads/${req.files.bannerImage[0].filename}`;
    }

    const updatedUser = await user.save();

    res.json(formatAuthUser(updatedUser));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the typed password with the encrypted password in MongoDB.
    const matches = await bcrypt.compare(currentPassword, user.password);

    if (!matches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const isFollowing = (currentUser, otherUserId) => {
  return currentUser.following.some((id) => id.toString() === otherUserId.toString());
};

const escapeRegex = (text) => {
  // Escape special regex characters so search text is treated like normal text.
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = {
  getUserByUsername,
  followUser,
  searchUsers,
  updateProfile,
  changePassword,
};
