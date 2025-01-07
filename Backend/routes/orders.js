const express = require("express");
const router = express.Router();
const Order = require("../models/orders"); // Import Order model
const authenticateToken = require("../middleware/authMiddleware"); // Authentication middleware
const { Restaurant } = require("../models/restaurantModel");
const User = require("../models/User");

// POST /api/orders - Place a new order
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { restaurant, items, totalAmount } = req.body;
    const customer = req.user.userId;

    // Input Validation
    if (!restaurant) {
      return res.status(400).json({ message: "Restaurant ID is required." });
    }
    if (!customer) {
      return res.status(400).json({ message: "Customer ID is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required." });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Valid total amount is required." });
    }

    // Fetch the customer's address from the User model
    const user = await User.findById(customer);
    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }
    const address = user.address;
    if (!address) {
      return res
        .status(400)
        .json({ message: "Customer address is missing in the profile." });
    }

    // Create a new order
    const order = new Order({
      restaurant,
      customer,
      items,
      totalAmount,
      address,
    });
    await order.save();

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    console.error("Error placing order:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// GET /api/orders - Retrieve all orders
router.get("/", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error retrieving orders:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// GET /api/orders/:orderId - Retrieve a specific order by ID
router.get("/:orderId", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Error retrieving order:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// PATCH /api/orders/:orderId/status - Update order status (protected for restaurant owners)
router.patch("/:orderId/status", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Check if the user is a restaurant owner (add role-based authorization)
    if (req.user.role !== "restaurant") {
      return res
        .status(403)
        .json({
          message: "Forbidden: Only restaurant owners can update order status.",
        });
    }

    // Find the order and check if it belongs to the user's restaurant
    const order = await Order.findById(orderId).populate("restaurant");
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Find the restaurant owned by the current user
    const userRestaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!userRestaurant) {
        return res.status(404).json({ message: "Restaurant not found for this user." });
    }

    // Check if the order's restaurant matches the user's restaurant
    if (!order.restaurant.equals(userRestaurant._id)) {
        return res.status(403).json({ message: "Forbidden: You can only update orders for your restaurant." });
    }

    // Validate the status (optional)
    const validStatuses = [
      "Pending",
      "Approved",
      "Declined",
      "Out for Delivery",
      "Delivered",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    // Update the order
    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated successfully.", order });
  } catch (error) {
    console.error("Error updating order status:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// GET /api/orders/restaurant - Get orders for a specific restaurant
router.get("/restaurant", authenticateToken, async (req, res) => {
  try {
    // Check if the user is a restaurant owner
    if (req.user.role !== "restaurant") {
      return res
        .status(403)
        .json({
          message: "Forbidden: Only restaurant owners can access this route.",
        });
    }

    // Find the restaurant owned by the current user
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found for this user." });
    }

    // Fetch orders for the found restaurant
    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("customer", "username phoneNumber address") // Populate customer details
      .populate("items.menuItem", "name"); // Populate menu item details

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
