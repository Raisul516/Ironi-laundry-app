const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({
        message: "All fields are required",
        required: ["name", "email", "password", "phone", "address"],
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Validate phone number (Bangladesh format)
    const phoneRegex = /^(\+880|880|0)?1[3456789]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid Bangladeshi phone number" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "User with this phone number already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      address,
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);

    // Check if it's a MongoDB connection error
    if (
      err.name === "MongoNetworkError" ||
      err.message.includes("ECONNREFUSED")
    ) {
      return res.status(500).json({
        message: "Database connection failed. Please try again later.",
        error: "MongoDB not connected",
      });
    }

    // Check if it's a validation error
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        error: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      message: "Registration failed",
      error: err.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res
        .status(400)
        .json({ message: "Account is deactivated. Please contact support." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    // Check if it's a MongoDB connection error
    if (
      err.name === "MongoNetworkError" ||
      err.message.includes("ECONNREFUSED")
    ) {
      return res.status(500).json({
        message: "Database connection failed. Please try again later.",
        error: "MongoDB not connected",
      });
    }

    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({
      message: "Failed to get profile",
      error: err.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (phone) {
      const phoneRegex = /^(\+880|880|0)?1[3456789]\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return res
          .status(400)
          .json({ message: "Please enter a valid Bangladeshi phone number" });
      }
      updateData.phone = phone;
    }
    if (address) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      message: "Failed to update profile",
      error: err.message,
    });
  }
};
