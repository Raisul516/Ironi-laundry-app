const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  createOrder,
  getUserOrders,
  getOrder,
} = require("../controllers/orderController");

// All routes require authentication
router.use(auth);

// Create new order
router.post("/", createOrder);

// Get user's orders
router.get("/", getUserOrders);

// Get single order
router.get("/:orderId", getOrder);

module.exports = router;
