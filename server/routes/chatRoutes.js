const express = require("express");
const {
  getConversations,
  startConversation,
  sendMessage,
} = require("../controllers/chatController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Chat routes are protected because only logged-in users can send DMs.
router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, startConversation);
router.post("/conversations/:id/messages", protect, sendMessage);

module.exports = router;
