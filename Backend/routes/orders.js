const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const authenticateToken = require("../middleware/authMiddleware");

// POST /api/orders - Place a new order
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { restaurant, items, totalAmount } = req.body;
    const customer = req.user.userId; // Get the user ID from the token

    // Input Validation
    if (!restaurant) {
      return res.status(400).json({ message: "Restaurant ID is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required." });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Valid total amount is required." });
    }

    // Create a new order
    const order = new Order({
      restaurant,
      customer,
      items,
      totalAmount,
      orderStatus: "Placed",
    });

    await order.save();

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// GET /api/orders - Fetch orders for the currently logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId; // Get the user ID from the token
    console.log("Fetching orders for customer ID:", customerId); // Debug log

    // Fetch orders for the logged-in user
    const orders = await Order.find({ customer: customerId })
      .populate("restaurant", "name") // Populate restaurant details
      .populate("items.menuItem", "name price") // Populate menu item details
      .populate("customer", "username phone address") // Populate customer details
      .sort({ createdAt: -1 });

    console.log("Orders fetched:", orders); // Debug log
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

module.exports = router;