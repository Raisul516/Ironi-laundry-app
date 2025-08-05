const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// DB & Server start
const startServer = async () => {
  try {
    // Set default JWT secret if not provided
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "ironi-secret-key-2024-super-secure";
    }

    // Use the MongoDB URI from .env file
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ironi-laundry";
    console.log("Attempting to connect to MongoDB:", mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB successfully!");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️  Starting server without database connection...");
    console.log("💡 Make sure MongoDB is running: mongod");
    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `🚀 Server running on port ${
          process.env.PORT || 5000
        } (without database)`
      );
    });
  }
};

startServer();
