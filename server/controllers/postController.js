const Post = require("../models/Post");
const User = require("../models/User");
const { formatPost, formatPublicUser, profileSelect } = require("../utils/userDto");

const postPopulate = [
  { path: "user", select: profileSelect },
  { path: "comments.user", select: profileSelect },
  {
    path: "repostOf",
    populate: [
      { path: "user", select: profileSelect },
      { path: "comments.user", select: profileSelect },
    ],
  },
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

    res.status(201).json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(postPopulate).sort({ createdAt: -1 });
    res.json(await Promise.all(posts.map(formatPostWithStats)));
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

    res.json(await Promise.all(posts.map(formatPostWithStats)));
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

    res.json(await Promise.all(posts.map(formatPostWithStats)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookmarkedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "bookmarks",
      populate: postPopulate,
      options: { sort: { createdAt: -1 } },
    });

    res.json(await Promise.all((user.bookmarks || []).map(formatPostWithStats)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const formatPostWithStats = async (post) => {
  const formatted = formatPost(post);
  const originalId = getOriginalPostId(formatted);
  const repostCount = await Post.countDocuments({ repostOf: originalId });

  return {
    ...formatted,
    repostCount,
    repostedBy: formatted.repostOf ? formatted.user : null,
  };
};

const getOriginalPostId = (post) => {
  // A repost points to another post. Use that original id for repost stats.
  if (post.repostOf) return post.repostOf._id;
  return post._id;
};

const searchPosts = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.json([]);
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const posts = await Post.find({ text: { $regex: safeQuery, $options: "i" } })
      .populate(postPopulate)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(await Promise.all(posts.map(formatPostWithStats)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExplore = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate(postPopulate)
      .sort({ createdAt: -1 })
      .limit(80);
    const formattedPosts = await Promise.all(posts.map(formatPostWithStats));

    const trendingPosts = [...formattedPosts].sort(sortByTrendingScore).slice(0, 8);

    const popularUsers = await User.find()
      .select("name username bio profilePic followers following +profilePhoto +avatar")
      .sort({ followers: -1, createdAt: -1 })
      .limit(6);

    const topicCounts = countTopics(formattedPosts);

    const trendingTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      trendingPosts,
      popularUsers: popularUsers.map(formatPublicUser),
      recentPosts: formattedPosts.slice(0, 12),
      trendingTopics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTrendingScore = (post) => {
  const realPost = post.repostOf || post;
  const likeCount = realPost.likes?.length || 0;
  const commentCount = realPost.comments?.length || 0;
  const repostCount = post.repostCount || 0;

  return likeCount + commentCount + repostCount;
};

const sortByTrendingScore = (postA, postB) => {
  return getTrendingScore(postB) - getTrendingScore(postA);
};

const countTopics = (posts) => {
  const topicCounts = new Map();

  posts.forEach((post) => {
    const realPost = post.repostOf || post;
    const text = realPost.text || "";
    const tags = text.match(/#[a-z0-9_]+/gi) || [];

    tags.forEach((tag) => {
      const topic = tag.toLowerCase();
      const oldCount = topicCounts.get(topic) || 0;
      topicCounts.set(topic, oldCount + 1);
    });
  });

  return topicCounts;
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
    await post.populate({ path: "comments.user", select: profileSelect });

    const latestComment = formatPost(post).comments[post.comments.length - 1];
    res.status(201).json(latestComment);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id" });
    }
    res.status(500).json({ message: error.message });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(req.user._id);
    const alreadyBookmarked = user.bookmarks.some(
      (id) => id.toString() === post._id.toString()
    );

    if (alreadyBookmarked) {
      user.bookmarks.pull(post._id);
    } else {
      user.bookmarks.push(post._id);
    }

    await user.save();

    res.json({
      message: alreadyBookmarked ? "Bookmark removed" : "Post bookmarked",
      bookmarks: user.bookmarks,
      bookmarked: !alreadyBookmarked,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Toggle repost state for a post: remove an existing repost or create a new one.
const toggleRepost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Use the original post id when checking for a repost to avoid duplicates.
    const originalId = post.repostOf || post._id;
    const existingRepost = await Post.findOne({
      user: req.user._id,
      repostOf: originalId,
    });

    if (existingRepost) {
      await existingRepost.deleteOne();
      return res.json({ message: "Repost removed", reposted: false });
    }

    // Create a repost entry for the authenticated user.
    const repost = await Post.create({
      user: req.user._id,
      repostOf: originalId,
      text: "",
      image: "",
    });
    await repost.populate(postPopulate);

    res.status(201).json({
      message: "Post reposted",
      reposted: true,
      post: await formatPostWithStats(repost),
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid post id" });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already reposted this post" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete a post only if it belongs to the authenticated user.
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

// Export all post controller functions for route usage.
module.exports = {
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
};
