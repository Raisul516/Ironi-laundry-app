const Rating = require("../models/Rating");

// Create or update rating for an order (prevent duplicate by upsert)
exports.submitRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, stars, feedback } = req.body;

    if (!orderId || !stars) {
      return res.status(400).json({ message: "orderId and stars are required" });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "stars must be between 1 and 5" });
    }

    const rating = await Rating.findOneAndUpdate(
      { userId, orderId },
      { stars, feedback: feedback || "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: "Rating submitted",
      rating: {
        id: rating._id,
        stars: rating.stars,
        feedback: rating.feedback,
        orderId: rating.orderId,
        userId: rating.userId,
        createdAt: rating.createdAt,
      },
    });
  } catch (err) {
    console.error("Submit rating error:", err);
    res.status(500).json({ message: "Failed to submit rating", error: err.message });
  }
};

// Get ratings for an order
exports.getOrderRatings = async (req, res) => {
  try {
    const { orderId } = req.params;
    const ratings = await Rating.find({ orderId }).sort({ createdAt: -1 });

    res.json({
      ratings: ratings.map((r) => ({
        id: r._id,
        stars: r.stars,
        feedback: r.feedback,
        userId: r.userId,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Get order ratings error:", err);
    res.status(500).json({ message: "Failed to get ratings", error: err.message });
  }
};

// Get average rating for an order
exports.getOrderAverage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await Rating.aggregate([
      { $match: { orderId: require("mongoose").Types.ObjectId.createFromHexString(orderId) } },
      { $group: { _id: "$orderId", avgStars: { $avg: "$stars" }, count: { $sum: 1 } } },
    ]);

    if (result.length === 0) {
      return res.json({ average: 0, count: 0 });
    }

    res.json({ average: Number(result[0].avgStars.toFixed(2)), count: result[0].count });
  } catch (err) {
    console.error("Get order average error:", err);
    res.status(500).json({ message: "Failed to get average rating", error: err.message });
  }
};

// Get current user's rating for an order
exports.getMyRatingForOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const rating = await Rating.findOne({ userId, orderId });
    if (!rating) return res.json({ rating: null });
    res.json({
      rating: {
        id: rating._id,
        stars: rating.stars,
        feedback: rating.feedback,
        createdAt: rating.createdAt,
      },
    });
  } catch (err) {
    console.error("Get my rating error:", err);
    res.status(500).json({ message: "Failed to get rating", error: err.message });
  }
};

