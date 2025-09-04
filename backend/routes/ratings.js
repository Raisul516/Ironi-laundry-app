const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { submitRating, getOrderRatings, getOrderAverage, getMyRatingForOrder } = require("../controllers/ratingController");

router.use(auth);

// Submit or update rating
router.post("/", submitRating);

// Get ratings for an order
router.get("/order/:orderId", getOrderRatings);

// Get average for an order
router.get("/order/:orderId/average", getOrderAverage);

// Get current user's rating for an order
router.get("/order/:orderId/me", getMyRatingForOrder);

module.exports = router;

