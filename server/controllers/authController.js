const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { formatAuthUser } = require("../utils/userDto");

// Create JWT token for logged in user
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ---------------- Register User ----------------
const register = async (req, res) => {
  try {
    // Get data from request body
    const { name, username, email, password } = req.body;

    // Check if all fields are filled
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Remove extra spaces and convert email to lowercase
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check if user already exists
    const alreadyUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (alreadyUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Encrypt password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const user = await User.create({
      name,
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
    });

    // Generate login token
    const token = createToken(user._id);

    // Send user data with token
    res.status(201).json(formatAuthUser(user, token));

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ---------------- Login User ----------------
const login = async (req, res) => {
  try {
    // Get email and password
    const { email, password } = req.body;

    // Check empty fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail }).select(
      "+profilePhoto +avatar"
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Compare entered password with saved password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Create token after successful login
    const token = createToken(user._id);

    // Send user details
    res.json(formatAuthUser(user, token));

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ---------------- Get Current User ----------------
// Returns details of logged in user
const getMe = (req, res) => {
  res.json(formatAuthUser(req.user));
};

module.exports = {
  register,
  login,
  getMe,
};