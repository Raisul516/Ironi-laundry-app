const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  createOrder,
  getUserOrders,
  getOrderHistory,
  getOrder,
  repeatOrder,
  cancelOrder,
  initiatePayment,
  confirmPayment,
  updateInstructions,
} = require("../controllers/orderController");

// All routes require authentication
router.use(auth);

// Create new order
router.post("/", createOrder);

// Get user's orders
router.get("/", getUserOrders);

// Get order history (alias for getUserOrders)
router.get("/history", getOrderHistory);

// Get single order
router.get("/:orderId", getOrder);

// Repeat order
router.post("/repeat/:orderId", repeatOrder);

// Cancel order
router.put("/:orderId/cancel", cancelOrder);

// Payment routes
router.post("/:orderId/pay", initiatePayment);
router.put("/:orderId/pay", confirmPayment);

// Update order instructions
router.put("/:orderId/instructions", updateInstructions);

module.exports = router;
