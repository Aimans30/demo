const express = require('express');
const router = express.Router();
const Order = require('../models/orders'); // Import Order model

// POST /api/orders
// Place a new order
router.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    // --- Basic Input Validation (Add more as needed) ---
    if (!orderData.restaurant || !orderData.customer || !orderData.items || !orderData.totalAmount) {
      return res.status(400).json({ message: "Incomplete order data provided" });
    }
    // --- End of Input Validation ---

    const order = new Order(orderData);
    await order.save();

    // Get the restaurant owner's ID:
    const ownerId = await order.getRestaurantOwnerId();

    // Now you have the ownerId, you can use it for:
    // - Sending notifications to the owner (e.g., using WebSockets or email)
    // - Displaying orders to the correct owner in their dashboard
    // - Filtering orders by owner, etc.
    console.log("Restaurant Owner ID:", ownerId); // Replace with your notification/logic

    res.status(201).json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// You can add more routes for orders here:
// - GET /api/orders (get all orders)
// - GET /api/orders/:orderId (get a specific order)
// - PATCH /api/orders/:orderId (update order status, etc.)
// - (Add authentication/authorization middleware to protect these routes)

module.exports = router;