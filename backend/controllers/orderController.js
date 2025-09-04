const Order = require("../models/Order");
const Notification = require("../models/Notification");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { pickupDate, pickupTime, address, services, items, instructions } =
      req.body;
    const userId = req.user.id;

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

    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const now = new Date();
    if (pickupDateTime <= now) {
      return res
        .status(400)
        .json({ message: "Pickup date and time must be in the future" });
    }

    const validServices = [
      "Washing",
      "Ironing",
      "Dry Cleaning",
      "Express Delivery",
    ];
    const invalidServices = services.filter((s) => !validServices.includes(s));
    if (invalidServices.length > 0) {
      return res.status(400).json({
        message: `Invalid services: ${invalidServices.join(", ")}`,
        validServices,
      });
    }

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
        return res
          .status(400)
          .json({ message: `Invalid item type: ${item.type}`, validItemTypes });
      }
      if (!item.quantity || item.quantity < 1) {
        return res
          .status(400)
          .json({ message: `Invalid quantity for ${item.type}` });
      }
    }

    // Service fees (flat) and pricing rule: total = totalItems * sum(service fees)
    const serviceFees = {
      Washing: 50,
      Ironing: 30,
      "Dry Cleaning": 80,
      "Express Delivery": 100,
    };
    const perItemServiceCost = services.reduce(
      (sum, s) => sum + (serviceFees[s] || 0),
      0
    );

    const totalItems = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalAmount = perItemServiceCost * totalItems;

    // Store items with a uniform per-item price equal to service cost
    const processedItems = items.map((it) => ({
      type: it.type,
      quantity: it.quantity,
      price: perItemServiceCost,
    }));

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

    await new Notification({
      userId,
      message: `Your order #${newOrder._id
        .toString()
        .slice(-6)} has been created. Pickup ${pickupDate} at ${pickupTime}.`,
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
    res
      .status(500)
      .json({ message: "Failed to create order", error: err.message });
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
    res
      .status(500)
      .json({ message: "Failed to get orders", error: err.message });
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
    const { pickupDate: reqPickupDate, pickupTime: reqPickupTime } =
      req.body || {};
    const userId = req.user.id;

    const originalOrder = await Order.findOne({ _id: orderId, userId });
    if (!originalOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    let nextPickupDate = reqPickupDate;
    let nextPickupTime = reqPickupTime;

    if (!nextPickupDate || !nextPickupTime) {
      // Default to 24 hours from now
      const plus48 = new Date();
      plus48.setHours(plus48.getHours() + 48);
      const yyyy = plus48.getFullYear();
      const mm = String(plus48.getMonth() + 1).padStart(2, "0");
      const dd = String(plus48.getDate()).padStart(2, "0");
      const hh = String(plus48.getHours()).padStart(2, "0");
      const mi = String(plus48.getMinutes()).padStart(2, "0");
      nextPickupDate = `${yyyy}-${mm}-${dd}`;
      nextPickupTime = `${hh}:${mi}`;
    }

    // Validate pickup in future
    const pickupDateTime = new Date(`${nextPickupDate}T${nextPickupTime}`);
    if (pickupDateTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Pickup date and time must be in the future" });
    }

    const newOrder = new Order({
      userId,
      pickupDate: nextPickupDate,
      pickupTime: nextPickupTime,
      address: originalOrder.address,
      services: originalOrder.services,
      items: originalOrder.items, // keep the same items
      totalAmount: originalOrder.totalAmount,
      status: "Pending",
      instructions: originalOrder.instructions,
    });

    await newOrder.save();

    await new Notification({
      userId,
      message: `Your order #${newOrder._id
        .toString()
        .slice(-6)} has been repeated from order #${originalOrder._id
        .toString()
        .slice(
          -6
        )}. Pickup scheduled for ${nextPickupDate} at ${nextPickupTime}.`,
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
    res
      .status(500)
      .json({ message: "Failed to repeat order", error: err.message });
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
    res
      .status(500)
      .json({ message: "Failed to get order", error: err.message });
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
