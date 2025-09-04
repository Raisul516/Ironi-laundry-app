const Claim = require("../models/Claim");

// Create a new damage claim
exports.createClaim = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, description, photoUrl } = req.body;

    if (!orderId || !description) {
      return res.status(400).json({ message: "orderId and description are required" });
    }

    const claim = new Claim({
      userId,
      orderId,
      description,
      photoUrl: photoUrl || "",
      status: "Pending",
    });

    await claim.save();

    res.status(201).json({
      message: "Claim submitted",
      claim: {
        id: claim._id,
        orderId: claim.orderId,
        description: claim.description,
        photoUrl: claim.photoUrl,
        status: claim.status,
        adminResponse: claim.adminResponse,
        createdAt: claim.createdAt,
      },
    });
  } catch (err) {
    console.error("Create claim error:", err);
    res.status(500).json({ message: "Failed to submit claim", error: err.message });
  }
};

// List claims for current user
exports.getMyClaims = async (req, res) => {
  try {
    const userId = req.user.id;
    const claims = await Claim.find({ userId }).sort({ createdAt: -1 });

    res.json({
      claims: claims.map((c) => ({
        id: c._id,
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
    console.error("Get my claims error:", err);
    res.status(500).json({ message: "Failed to get claims", error: err.message });
  }
};

// Get claims for a specific order (for showing on order details)
exports.getClaimsForOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const claims = await Claim.find({ userId, orderId }).sort({ createdAt: -1 });

    res.json({
      claims: claims.map((c) => ({
        id: c._id,
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
    console.error("Get claims for order error:", err);
    res.status(500).json({ message: "Failed to get claims", error: err.message });
  }
};

// Admin: update claim status/response (stub)
exports.updateClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, adminResponse } = req.body;

    const allowed = ["Pending", "Approved", "Rejected"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (status) claim.status = status;
    if (adminResponse !== undefined) claim.adminResponse = adminResponse;
    await claim.save();

    res.json({ message: "Claim updated", claim });
  } catch (err) {
    console.error("Update claim error:", err);
    res.status(500).json({ message: "Failed to update claim", error: err.message });
  }
};

