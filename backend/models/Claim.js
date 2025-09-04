const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  description: { type: String, required: true },
  photoUrl: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  adminResponse: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

claimSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Claim", claimSchema);

