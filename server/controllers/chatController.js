const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { formatPublicUser, profileSelect } = require("../utils/userDto");

// Populate user details in conversation and messages
const conversationPopulate = [
  { path: "participants", select: profileSelect },
  { path: "messages.sender", select: profileSelect },
];

// Convert conversation into simple response object
const formatConversation = (conversation) => {
  const conversationData =
    typeof conversation.toObject === "function"
      ? conversation.toObject()
      : conversation;

  return {
    ...conversationData,
    participants: (conversationData.participants || []).map(formatPublicUser),
    messages: (conversationData.messages || []).map((message) => ({
      ...message,
      sender: formatPublicUser(message.sender),
    })),
  };
};

// Find conversation between two users
const findConversation = (currentUserId, recipientId) =>
  Conversation.findOne({
    participants: { $all: [currentUserId, recipientId], $size: 2 },
  });

// Check if current user follows the recipient
const followsUser = (currentUser, recipientId) =>
  (currentUser.following || []).some(
    (id) => id.toString() === recipientId.toString()
  );

// ---------------- Get All Conversations ----------------
const getConversations = async (req, res) => {
  try {
    // Get conversations of logged in user
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate(conversationPopulate)
      .sort({ updatedAt: -1 });

    res.json(conversations.map(formatConversation));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Start New Conversation ----------------
const startConversation = async (req, res) => {
  try {
    const { recipientId } = req.body || {};

    // Check recipient id
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    // User cannot message themselves
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    // Find recipient
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only followed users can receive messages
    if (!followsUser(req.user, recipient._id)) {
      return res.status(403).json({
        message: "You can only message people you follow",
      });
    }

    // Find existing conversation
    let conversation = await findConversation(req.user._id, recipientId);

    // Create new conversation if not found
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        messages: [],
      });
    }

    await conversation.populate(conversationPopulate);

    res.status(201).json(formatConversation(conversation));
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user id" });
    }

    res.status(500).json({ message: error.message });
  }
};

// ---------------- Send Message ----------------
const sendMessage = async (req, res) => {
  try {
    // Get message text
    const text = ((req.body && req.body.text) || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    // Find conversation
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Find receiver id
    const recipientId = conversation.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    // Check follow permission
    if (!recipientId || !followsUser(req.user, recipientId)) {
      return res.status(403).json({
        message: "You can only message people you follow",
      });
    }

    // Add new message
    conversation.messages.push({
      sender: req.user._id,
      text,
    });

    await conversation.save();

    await conversation.populate({
      path: "messages.sender",
      select: profileSelect,
    });

    // Return latest message
    const latestMessage = formatConversation(conversation).messages[
      conversation.messages.length - 1
    ];

    res.status(201).json(latestMessage);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid conversation id",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  startConversation,
  sendMessage,
};