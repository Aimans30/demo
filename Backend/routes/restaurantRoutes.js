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
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in isRestaurantOwner middleware:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Protected route for restaurant owners (example)
router.get('/dashboard', authenticateToken, isRestaurantOwner, async (req, res) => {
  res.json({ message: 'Welcome to the restaurant dashboard', user: req.user });
});

// GET /api/restaurants (Public route to fetch all restaurants)
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('menu', 'name category'); // Populate the menu if needed

    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search for restaurants (public)
router.get('/search', async (req, res) => {
    const { q } = req.query;
    try {
      const restaurants = await Restaurant.find({
        name: { $regex: q, $options: 'i' }, // Case-insensitive search
      });
      res.json(restaurants);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Search for menu items within a specific restaurant
  router.get('/:restaurantId/menu/search', async (req, res) => {
    const { restaurantId } = req.params;
    const { q } = req.query;
    try {
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
      console.error(error);
      res.status(500).json({ message: 'Server error' });
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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

    // Check if the restaurant associated with the order belongs to the logged-in user
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    order.orderStatus = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/restaurant/menu (add a new menu item)
router.post('/menu', authenticateToken, isRestaurantOwner, async (req, res) => {
  console.log('POST /api/restaurant/menu route hit');
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { name, category, sizes } = req.body;

    if (!name || !category || typeof sizes !== 'object') {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    // Convert sizes to Map if necessary (if using Map in schema)
    let sizesMap = new Map();
    if (sizes) {
      for (const key in sizes) {
        const value = parseFloat(sizes[key]);
        if (!isNaN(value)) {
          sizesMap.set(key, value);
        } else {
          return res.status(400).json({ message: `Invalid price for size: ${key}` });
        }
      }
    }

    const newItem = new MenuItem({
      name,
      category,
      sizes: sizesMap, // Or just sizes if you changed the schema to Object
      restaurant: restaurant._id,
    });

    await newItem.save();

    // Add the new menu item to the restaurant's menu
    restaurant.menu.push(newItem._id);
    await restaurant.save();

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid input', error: err.message });
  }
});

// PATCH /api/restaurant/menu/:itemId (edit an existing menu item)
router.patch('/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { name, category, sizes } = req.body;

    // Validate that at least one field is being updated
    if (!name && !category && !sizes) {
        return res.status(400).json({ message: 'No fields to update provided' });
    }

    let updateFields = {};
    if (name) updateFields.name = name;
    if (category) updateFields.category = category;

    // Convert sizes to Map if necessary
    if (sizes && typeof sizes === 'object') {
        let sizesMap = new Map();
        for (const key in sizes) {
            const value = parseFloat(sizes[key]);
            if (!isNaN(value)) {
                sizesMap.set(key, value);
            } else {
                return res.status(400).json({ message: `Invalid price for size: ${key}` });
            }
        }
        updateFields.sizes = sizesMap;
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
        req.params.itemId,
        { ...updateFields, restaurant: restaurant._id },
        { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(updatedItem);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid input', error: err.message });
  }
});

// DELETE /api/restaurant/menu/:itemId (delete a menu item)
router.delete('/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const deletedItem = await MenuItem.findByIdAndDelete(req.params.itemId);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Remove the deleted item from the restaurant's menu
    restaurant.menu = restaurant.menu.filter(
      (item) => item.toString() !== req.params.itemId
    );
    await restaurant.save();

    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;