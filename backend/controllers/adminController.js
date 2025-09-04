const Order = require("../models/Order");
const User = require("../models/User");
const Rating = require("../models/Rating");
const Claim = require("../models/Claim");
const Notification = require("../models/Notification");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.json({
      orders: orders.map((o) => ({
        id: o._id,
        user: o.userId
          ? { id: o.userId._id, name: o.userId.name, email: o.userId.email }
          : null,
        pickupDate: o.pickupDate,
        pickupTime: o.pickupTime,
        address: o.address,
        services: o.services,
        items: o.items,
        totalAmount: o.totalAmount,
        status: o.status,
        instructions: o.instructions,
        payment: o.payment,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Admin getAllOrders error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = [
      "Pending",
      "Confirmed",
      "Washing",
      "Delivered",
      "Cancelled",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      message: "Order status updated",
      order: {
        id: order._id,
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    console.error("Admin updateOrderStatus error:", err);
    res
      .status(500)
      .json({ message: "Failed to update status", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email role createdAt").sort({
      createdAt: -1,
    });
    res.json({ users });
  } catch (err) {
    console.error("Admin getAllUsers error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Optional: cascade delete or anonymize related data can be added here
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Admin deleteUser error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete user", error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [usersCount, activeOrders, pendingClaims, ratingsAgg] =
      await Promise.all([
        User.countDocuments({}),
        Order.countDocuments({
          status: { $in: ["Pending", "Confirmed", "Washing"] },
        }),
        Claim.countDocuments({ status: "Pending" }),
        Rating.aggregate([
          {
            $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } },
          },
        ]),
      ]);

    const avgRating = ratingsAgg[0]?.avg
      ? Number(ratingsAgg[0].avg.toFixed(2))
      : 0;
    const ratingsCount = ratingsAgg[0]?.count || 0;

    res.json({
      totalUsers: usersCount,
      activeOrders,
      pendingClaims,
      averageRating: avgRating,
      ratingsCount,
      pendingFeedbackFlags: 0,
    });
  } catch (err) {
    console.error("Admin getStats error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: err.message });
  }
};

exports.getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "name email");
    res.json({
      ratings: ratings.map((r) => ({
        id: r._id,
        user: r.userId
          ? { id: r.userId._id, name: r.userId.name, email: r.userId.email }
          : null,
        orderId: r.orderId,
        stars: r.stars,
        feedback: r.feedback,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin getAllRatings error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch ratings", error: err.message });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const deleted = await Rating.findByIdAndDelete(ratingId);
    if (!deleted) return res.status(404).json({ message: "Rating not found" });
    res.json({ message: "Rating deleted" });
  } catch (err) {
    console.error("Admin deleteRating error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete rating", error: err.message });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "name email");
    res.json({
      claims: claims.map((c) => ({
        id: c._id,
        user: c.userId
          ? { id: c.userId._id, name: c.userId.name, email: c.userId.email }
          : null,
        orderId: c.orderId,
        description: c.description,
        photoUrl: c.photoUrl,
        status: c.status,
        adminResponse: c.adminResponse,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Admin getAllClaims error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch claims", error: err.message });
  }
};

exports.updateClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, adminResponse } = req.body;
    const allowed = ["Pending", "Approved", "Rejected"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (status === "Rejected" && (!adminResponse || !adminResponse.trim())) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }
    if (status) claim.status = status;
    if (adminResponse !== undefined) claim.adminResponse = adminResponse;
    await claim.save();

    // Send notification to user for claim decision
    if (status === "Approved" || status === "Rejected") {
      const msg =
        status === "Approved"
          ? `Your damage claim for order #${String(claim.orderId).slice(
              -6
            )} has been approved. ${
              adminResponse ? `Note: ${adminResponse}` : ""
            }`
          : `Your damage claim for order #${String(claim.orderId).slice(
              -6
            )} has been rejected. Reason: ${adminResponse || "N/A"}`;
      await new Notification({
        userId: claim.userId,
        message: msg,
        type: "status_update",
        orderId: claim.orderId,
      }).save();
    }

    res.json({
      message: "Claim updated",
      claim: {
        id: claim._id,
        status: claim.status,
        adminResponse: claim.adminResponse,
      },
    });
  } catch (err) {
    console.error("Admin updateClaim error:", err);
    res
      .status(500)
      .json({ message: "Failed to update claim", error: err.message });
  }
};
