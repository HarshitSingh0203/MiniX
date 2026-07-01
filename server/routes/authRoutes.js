const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Auth routes handle register, login, and current user lookup.
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
