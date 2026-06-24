const express = require("express");
const {
  getUserByUsername,
  followUser,
  searchUsers,
  updateProfile,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/search", searchUsers);
router.put("/profile/update", protect, upload.single("profilePic"), updateProfile);
router.put("/:id/follow", protect, followUser);
router.get("/:username", getUserByUsername);

module.exports = router;
