const Post = require("../models/Post");
const User = require("../models/User");

const postPopulate = [
  { path: "user", select: "name username profilePic" },
  { path: "comments.user", select: "name username profilePic" },
];

const createPost = async (req, res) => {
  try {
    const text = ((req.body && req.body.text) || "").trim();
    const image = req.file ? `uploads/${req.file.filename}` : "";

    if (!text && !image) {
      return res.status(400).json({ message: "Post text or image is required" });
    }

    const post = await Post.create({ user: req.user._id, text, image });
    await post.populate(postPopulate);

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(postPopulate).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const userIds = [...req.user.following, req.user._id];
    const posts = await Post.find({ user: { $in: userIds } })
      .populate(postPopulate)
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
      .populate(postPopulate)
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ message: alreadyLiked ? "Like removed" : "Post liked", likes: post.likes });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id" });
    }
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const text = ((req.body && req.body.text) || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate({ path: "comments.user", select: "name username profilePic" });

    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id" });
    }
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getFeed,
  getUserPosts,
  likePost,
  addComment,
  deletePost,
};
