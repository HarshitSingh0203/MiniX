const mongoose = require("mongoose");

// One message inside a direct message conversation.
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Conversation stores the two users and their messages.
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [messageSchema],
  },
  { timestamps: true }
);

// This helps MongoDB find conversations by participant.
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
