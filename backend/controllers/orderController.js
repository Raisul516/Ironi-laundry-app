const Order = require("../models/Order");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { pickupDate, pickupTime, address, services, items } = req.body;
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
    });

    await newOrder.save();

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

// Get user's orders
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
        createdAt: order.createdAt,
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
        createdAt: order.createdAt,
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
