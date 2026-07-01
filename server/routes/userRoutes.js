const express = require("express");
const {
  getUserByUsername,
  followUser,
  searchUsers,
  updateProfile,
  changePassword,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// User routes handle search, profile updates, follows, and password changes.
router.get("/search", searchUsers);
router.put(
  "/profile/update",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  updateProfile
);
router.put("/password", protect, changePassword);
router.put("/:id/follow", protect, followUser);
router.get("/:username", getUserByUsername);

module.exports = router;
