const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  deleteUser,
  getStats,
  getAllRatings,
  deleteRating,
  getAllClaims,
  updateClaim,
} = require("../controllers/adminController");

router.use(auth);
router.use(adminOnly);

router.get("/orders", getAllOrders);
router.put("/orders/:orderId/status", updateOrderStatus);

router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);

router.get("/stats", getStats);
router.get("/ratings", getAllRatings);
router.delete("/ratings/:ratingId", deleteRating);
router.get("/claims", getAllClaims);
router.put("/claims/:claimId", updateClaim);

module.exports = router;
