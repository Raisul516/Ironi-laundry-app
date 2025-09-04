const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { createClaim, getMyClaims, getClaimsForOrder, updateClaimStatus } = require("../controllers/claimController");

router.use(auth);

// Create a new claim
router.post("/", createClaim);

// List current user's claims
router.get("/me", getMyClaims);

// List claims for a specific order (owned by user)
router.get("/order/:orderId", getClaimsForOrder);

// Admin: update claim status/response (stub)
router.put("/:claimId", updateClaimStatus);

module.exports = router;

