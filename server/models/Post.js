const mongoose = require("mongoose");

// Small schema for comments inside a post.
const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Post document stores normal posts and reposts.
const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    repostOf: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// One user can repost the same original post only once.
postSchema.index(
  { user: 1, repostOf: 1 },
  { unique: true, partialFilterExpression: { repostOf: { $type: "objectId" } } }
);

module.exports = mongoose.model("Post", postSchema);
