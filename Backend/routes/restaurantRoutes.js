const express = require('express');
const router = express.Router();
const Restaurant = require('../models/restaurantModel');
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
    res.status(500).json({ message: 'Server error in isRestaurantOwner middleware' });
  }
};

// --- User Authentication Routes ---
router.get('/panel', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const pendingOrders = await Order.find({ 
      restaurant: restaurant._id,
      orderStatus: 'Placed'
    }).populate('customer', 'username');

    res.json({
      restaurant,
      pendingOrders,
      message: 'Restaurant panel data fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching restaurant panel:', error);
    res.status(500).json({ 
      message: 'Failed to load restaurant panel', 
      error: error.message 
    });
  }
});

router.get('/dashboard', authenticateToken, isRestaurantOwner, async (req, res) => {
  res.json({ message: 'Welcome to the restaurant dashboard', user: req.user });
});

router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching restaurants' });
  }
});

router.get('/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching restaurant' });
  }
});

// Updated route to handle orders for a specific restaurant by its ID
router.get('/:restaurantId/orders', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findOne({ _id: restaurantId, owner: req.user.userId });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this user' });
    }

    const orders = await Order.find({ restaurant: restaurant._id, orderStatus: 'Placed' })
      .populate('customer', 'username');
    res.json(orders);
  } catch (err) {
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

    res.json(restaurant.menu);
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

    const { name, sizes } = req.body;
    if (!name || !sizes || typeof sizes !== 'object') {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    restaurant.menu.push({ name, sizes });
    await restaurant.save();
    res.status(201).json(restaurant.menu[restaurant.menu.length - 1]);
  } catch (err) {
    console.error('Error adding menu item:', err.message);
    res.status(500).json({ message: 'Server error adding menu item' });
  }
});

// PATCH /api/restaurant/menu/:itemId (edit an existing menu item)
router.patch('/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const { name, sizes } = req.body;
    if (!name && !sizes) {
      return res.status(400).json({ message: 'No fields to update provided' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItemIndex = restaurant.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (menuItemIndex === -1) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (name) restaurant.menu[menuItemIndex].name = name;
    if (sizes) restaurant.menu[menuItemIndex].sizes = sizes;

    await restaurant.save();
    res.json(restaurant.menu[menuItemIndex]);
  } catch (err) {
    console.error('Error updating menu item:', err.message);
    res.status(500).json({ message: 'Server error updating menu item' });
  }
});

// DELETE /api/restaurant/menu/:itemId (delete a menu item)
router.delete('/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItemIndex = restaurant.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (menuItemIndex === -1) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    restaurant.menu.splice(menuItemIndex, 1);
    await restaurant.save();
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    console.error('Error deleting menu item:', err.message);
    res.status(500).json({ message: 'Server error deleting menu item' });
  }
});

module.exports = router;
