const express = require('express');
const router = express.Router();
const { Restaurant, MenuItem } = require('../models/restaurantModel');
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/orders');

// Middleware to check if the user is a restaurant owner
const isRestaurantOwner = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Forbidden: User is not a restaurant owner' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in isRestaurantOwner middleware:', error.message);
    res.status(500).json({ message: 'Server error in isRestaurantOwner middleware' });
  }
};

// Protected route for restaurant owners (example)
router.get('/dashboard', authenticateToken, isRestaurantOwner, async (req, res) => {
  res.json({ message: 'Welcome to the restaurant dashboard', user: req.user });
});

// GET /api/restaurants (Public route to fetch all restaurants)
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate('menu', 'name category');
    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching restaurants:', err.message);
    res.status(500).json({ message: 'Server error fetching restaurants' });
  }
});

// Search for restaurants (public)
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    if (!q) {
      return res.status(400).json({ message: 'Query parameter (q) is required' });
    }
    const restaurants = await Restaurant.find({ name: { $regex: q, $options: 'i' } });
    res.json(restaurants);
  } catch (error) {
    console.error('Error searching restaurants:', error.message);
    res.status(500).json({ message: 'Server error searching restaurants' });
  }
});

// Search for menu items within a specific restaurant
router.get('/:restaurantId/menu/search', async (req, res) => {
  const { restaurantId } = req.params;
  const { q } = req.query;
  try {
    if (!q) {
      return res.status(400).json({ message: 'Query parameter (q) is required' });
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({
      restaurant: restaurantId,
      name: { $regex: q, $options: 'i' },
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Error searching menu items:', error.message);
    res.status(500).json({ message: 'Server error searching menu items' });
  }
});

// GET /api/restaurant/orders (fetch pending orders for the logged-in restaurant)
router.get('/orders', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this user' });
    }

    const orders = await Order.find({ restaurant: restaurant._id, orderStatus: 'Placed' })
      .populate('customer', 'username')
      .populate('items.menuItem', 'name');
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// PATCH /api/restaurant/orders/:orderId (update order status)
router.patch('/orders/:orderId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: Order does not belong to this restaurant' });
    }

    order.orderStatus = status;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ message: 'Server error updating order status' });
  }
});

// GET /api/restaurant/menu (fetch the menu for the logged-in restaurant)
router.get('/menu', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ restaurant: restaurant._id });
    res.json(menuItems);
  } catch (err) {
    console.error('Error fetching menu:', err.message);
    res.status(500).json({ message: 'Server error fetching menu' });
  }
});

// POST /api/restaurant/menu (add a new menu item)
router.post('/menu', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { name, category, sizes } = req.body;
    if (!name || !category || !sizes || typeof sizes !== 'object') {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    const newItem = new MenuItem({
      name,
      category,
      sizes,
      restaurant: restaurant._id,
    });

    await newItem.save();
    restaurant.menu.push(newItem._id);
    await restaurant.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error adding menu item:', err.message);
    res.status(500).json({ message: 'Server error adding menu item' });
  }
});

// PATCH /api/restaurant/menu/:itemId (edit an existing menu item)
router.patch('/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const { name, category, sizes } = req.body;
    if (!name && !category && !sizes) {
      return res.status(400).json({ message: 'No fields to update provided' });
    }

    const updateFields = { name, category, sizes };
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      updateFields,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating menu item:', err.message);
    res.status(500).json({ message: 'Server error updating menu item' });
  }
});

// DELETE /api/restaurant/menu/:itemId (delete a menu item)
router.delete('/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.itemId);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    console.error('Error deleting menu item:', err.message);
    res.status(500).json({ message: 'Server error deleting menu item' });
  }
});

module.exports = router;
