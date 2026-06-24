const express = require("express");
const {
  createPost,
  getPosts,
  getFeed,
  getUserPosts,
  likePost,
  addComment,
  deletePost,
} = require("../controllers/postController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, upload.single("image"), createPost);
router.get("/", getPosts);
router.get("/feed", protect, getFeed);
router.get("/user/:username", getUserPosts);
router.put("/:id/like", protect, likePost);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);

module.exports = router;
