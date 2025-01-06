const express = require('express');
const router = express.Router();
const Order = require('../models/orders'); // Import Order model

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
  try {
    const { restaurant, customer, items, totalAmount } = req.body;

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

    // Create a new order
    const order = new Order({ restaurant, customer, items, totalAmount });
    await order.save();

    // Fetch the restaurant owner's ID (replace with actual logic if needed)
    const ownerId = await order.getRestaurantOwnerId?.();
    if (!ownerId) {
      return res.status(404).json({ message: "Restaurant owner not found." });
    }

    console.log("Restaurant Owner ID:", ownerId); // Debugging/Notifications logic

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    console.error("Error placing order:", error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/orders - Retrieve all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error retrieving orders:", error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/orders/:orderId - Retrieve a specific order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Error retrieving order:", error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PATCH /api/orders/:orderId - Update order status or details
router.patch('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const order = await Order.findByIdAndUpdate(orderId, updates, { new: true });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ message: "Order updated successfully.", order });
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
