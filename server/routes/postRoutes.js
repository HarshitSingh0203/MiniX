const express = require("express");
const {
  createPost,
  getPosts,
  getFeed,
  getExplore,
  getUserPosts,
  getBookmarkedPosts,
  searchPosts,
  likePost,
  addComment,
  toggleBookmark,
  toggleRepost,
  deletePost,
} = require("../controllers/postController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Post routes are used by the feed, explore page, bookmarks, and post actions.
router.post("/", protect, upload.single("image"), createPost);
router.get("/", getPosts);
router.get("/feed", protect, getFeed);
router.get("/explore", getExplore);
router.get("/bookmarks", protect, getBookmarkedPosts);
router.get("/search", searchPosts);
router.get("/user/:username", getUserPosts);
router.put("/:id/like", protect, likePost);
router.put("/:id/bookmark", protect, toggleBookmark);
router.put("/:id/repost", protect, toggleRepost);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);

module.exports = router;
