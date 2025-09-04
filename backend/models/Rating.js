const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

ratingSchema.index({ userId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);

