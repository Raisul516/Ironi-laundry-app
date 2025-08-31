const Order = require("../models/Order");
const Notification = require("../models/Notification");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { pickupDate, pickupTime, address, services, items, instructions } =
      req.body;
    const userId = req.user.id;

    // Validate required fields
    if (
      !pickupDate ||
      !pickupTime ||
      !address ||
      !services ||
      services.length === 0 ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "All fields are required: pickupDate, pickupTime, address, at least one service, and at least one item",
      });
    }

    // Validate pickup date (should not be in the past)
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const now = new Date();
    if (pickupDateTime <= now) {
      return res.status(400).json({
        message: "Pickup date and time must be in the future",
      });
    }

    // Validate services
    const validServices = [
      "Washing",
      "Ironing",
      "Dry Cleaning",
      "Express Delivery",
    ];
    const invalidServices = services.filter(
      (service) => !validServices.includes(service)
    );
    if (invalidServices.length > 0) {
      return res.status(400).json({
        message: `Invalid services: ${invalidServices.join(", ")}`,
        validServices,
      });
    }

    // Validate items
    const validItemTypes = [
      "Shirt",
      "Pants",
      "Dress",
      "Suit",
      "Jacket",
      "Sweater",
      "T-Shirt",
      "Jeans",
      "Skirt",
      "Blouse",
      "Coat",
      "Towel",
      "Bed Sheet",
      "Curtain",
      "Table Cloth",
    ];

    for (const item of items) {
      if (!validItemTypes.includes(item.type)) {
        return res.status(400).json({
          message: `Invalid item type: ${item.type}`,
          validItemTypes,
        });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message: `Invalid quantity for ${item.type}`,
        });
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // Base prices for different item types
      const basePrices = {
        Shirt: 30,
        Pants: 40,
        Dress: 60,
        Suit: 100,
        Jacket: 80,
        Sweater: 50,
        "T-Shirt": 25,
        Jeans: 45,
        Skirt: 35,
        Blouse: 35,
        Coat: 90,
        Towel: 20,
        "Bed Sheet": 80,
        Curtain: 120,
        "Table Cloth": 60,
      };

      const basePrice = basePrices[item.type] || 30;
      let itemPrice = basePrice;

      // Apply service multipliers
      if (services.includes("Washing")) {
        itemPrice += basePrice * 0.5; // 50% extra for washing
      }
      if (services.includes("Ironing")) {
        itemPrice += basePrice * 0.3; // 30% extra for ironing
      }
      if (services.includes("Dry Cleaning")) {
        itemPrice += basePrice * 0.8; // 80% extra for dry cleaning
      }
      if (services.includes("Express Delivery")) {
        itemPrice += basePrice * 0.4; // 40% extra for express delivery
      }

      const totalItemPrice = itemPrice * item.quantity;
      totalAmount += totalItemPrice;

      processedItems.push({
        type: item.type,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    // Create new order
    const newOrder = new Order({
      userId,
      pickupDate,
      pickupTime,
      address,
      services,
      items: processedItems,
      totalAmount,
      status: "Pending",
      instructions: instructions || "",
    });

    await newOrder.save();

    // Create notification for order creation
    await new Notification({
      userId,
      message: `Your order #${newOrder._id
        .toString()
        .slice(
          -6
        )} has been created successfully. Pickup scheduled for ${pickupDate} at ${pickupTime}.`,
      type: "status_update",
      orderId: newOrder._id,
    }).save();

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: newOrder._id,
        pickupDate: newOrder.pickupDate,
        pickupTime: newOrder.pickupTime,
        address: newOrder.address,
        services: newOrder.services,
        items: newOrder.items,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        instructions: newOrder.instructions,
        payment: newOrder.payment,
        createdAt: newOrder.createdAt,
      },
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      message: "Failed to create order",
      error: err.message,
    });
  }
};

// Get user's orders (order history)
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.json({
      orders: orders.map((order) => ({
        id: order._id,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        address: order.address,
        services: order.services,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        instructions: order.instructions,
        payment: order.payment,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({
      message: "Failed to get orders",
      error: err.message,
    });
  }
};

// Get order history (alias for getUserOrders)
exports.getOrderHistory = async (req, res) => {
  return exports.getUserOrders(req, res);
};

// Repeat order
exports.repeatOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find the original order
    const originalOrder = await Order.findOne({ _id: orderId, userId });
    if (!originalOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Set default pickup time to tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultPickupDate = tomorrow.toISOString().split("T")[0];
    const defaultPickupTime = "10:00";

    // Create new order with same items and services
    const newOrder = new Order({
      userId,
      pickupDate: defaultPickupDate,
      pickupTime: defaultPickupTime,
      address: originalOrder.address,
      services: originalOrder.services,
      items: originalOrder.items,
      totalAmount: originalOrder.totalAmount,
      status: "Pending",
      instructions: originalOrder.instructions,
    });

    await newOrder.save();

    // Create notification for repeated order
    await new Notification({
      userId,
      message: `Your order #${newOrder._id
        .toString()
        .slice(-6)} has been repeated from order #${originalOrder._id
        .toString()
        .slice(
          -6
        )}. Pickup scheduled for ${defaultPickupDate} at ${defaultPickupTime}.`,
      type: "status_update",
      orderId: newOrder._id,
    }).save();

    res.status(201).json({
      message: "Order repeated successfully",
      order: {
        id: newOrder._id,
        pickupDate: newOrder.pickupDate,
        pickupTime: newOrder.pickupTime,
        address: newOrder.address,
        services: newOrder.services,
        items: newOrder.items,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        instructions: newOrder.instructions,
        payment: newOrder.payment,
        createdAt: newOrder.createdAt,
      },
    });
  } catch (err) {
    console.error("Repeat order error:", err);
    res.status(500).json({
      message: "Failed to repeat order",
      error: err.message,
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      order: {
        id: order._id,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        address: order.address,
        services: order.services,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        instructions: order.instructions,
        payment: order.payment,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({
      message: "Failed to get order",
      error: err.message,
    });
  }
};

// Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        message: "Payment can only be initiated for pending orders",
      });
    }

    if (order.payment.status === "Paid") {
      return res.status(400).json({
        message: "Order is already paid",
      });
    }

    // Update payment method
    order.payment.method = paymentMethod;
    order.payment.status = "Pending";

    if (paymentMethod === "COD") {
      // For COD, we can mark as paid immediately
      order.payment.status = "Paid";
      order.payment.paidAt = new Date();
      order.status = "Confirmed";
    }

    await order.save();

    // Create notification
    await new Notification({
      userId,
      message: `Payment initiated for order #${order._id
        .toString()
        .slice(-6)} using ${paymentMethod}.`,
      type: "payment",
      orderId: order._id,
    }).save();

    res.json({
      message: "Payment initiated successfully",
      payment: order.payment,
      orderStatus: order.status,
    });
  } catch (err) {
    console.error("Initiate payment error:", err);
    res.status(500).json({
      message: "Failed to initiate payment",
      error: err.message,
    });
  }
};

// Confirm payment (for card/wallet payments)
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transactionId } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.payment.status === "Paid") {
      return res.status(400).json({
        message: "Order is already paid",
      });
    }

    // Update payment status
    order.payment.status = "Paid";
    order.payment.transactionId = transactionId;
    order.payment.paidAt = new Date();
    order.status = "Confirmed";

    await order.save();

    // Create notification
    await new Notification({
      userId,
      message: `Payment confirmed for order #${order._id
        .toString()
        .slice(-6)}. Your order is now confirmed and will be processed.`,
      type: "payment",
      orderId: order._id,
    }).save();

    res.json({
      message: "Payment confirmed successfully",
      payment: order.payment,
      orderStatus: order.status,
    });
  } catch (err) {
    console.error("Confirm payment error:", err);
    res.status(500).json({
      message: "Failed to confirm payment",
      error: err.message,
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation for pending orders
    if (order.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending orders can be cancelled",
      });
    }

    // Update order status to cancelled
    order.status = "Cancelled";
    await order.save();

    // Create notification for order cancellation
    await new Notification({
      userId,
      message: `Your order #${order._id
        .toString()
        .slice(-6)} has been cancelled successfully.`,
      type: "status_update",
      orderId: order._id,
    }).save();

    res.json({
      message: "Order cancelled successfully",
      order: {
        id: order._id,
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({
      message: "Failed to cancel order",
      error: err.message,
    });
  }
};

// Update order instructions
exports.updateInstructions = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { instructions } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        message: "Instructions can only be updated for pending orders",
      });
    }

    order.instructions = instructions;
    await order.save();

    res.json({
      message: "Instructions updated successfully",
      instructions: order.instructions,
    });
  } catch (err) {
    console.error("Update instructions error:", err);
    res.status(500).json({
      message: "Failed to update instructions",
      error: err.message,
    });
  }
};
