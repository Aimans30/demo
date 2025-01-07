const express = require('express');
const router = express.Router();
const Restaurant = require('../models/restaurantModel');
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/orders');
const mongoose = require('mongoose');

// Middleware
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

// Helper Functions
const getRestaurant = async (userId) => {
  return await Restaurant.findOne({ owner: userId });
};

const handleError = (res, error, message) => {
  res.status(500).json({ message: message, error: error.message });
};

// Restaurant Routes
router.post('/restaurant/menu', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const restaurant = await getRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.menu.push({ name, price, description });
    await restaurant.save();
    res.status(201).json({ message: 'Menu item added successfully', menu: restaurant.menu });
  } catch (error) {
    handleError(res, error, 'Server error adding menu item');
  }
});

router.get('/restaurant/orders', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const orders = await Order.find({ restaurant: req.user.restaurant });
    res.json(orders);
  } catch (error) {
    handleError(res, error, 'Server error fetching orders');
  }
});

router.put('/restaurant/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const restaurant = await getRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.name = name || menuItem.name;
    menuItem.price = price || menuItem.price;
    menuItem.description = description || menuItem.description;

    await restaurant.save();
    res.json({ message: 'Menu item updated successfully', menu: restaurant.menu });
  } catch (error) {
    handleError(res, error, 'Server error updating menu item');
  }
});

router.delete('/restaurant/menu/:itemId', authenticateToken, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await getRestaurant(req.user._id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.remove();
    await restaurant.save();
    res.json({ message: 'Menu item deleted successfully', menu: restaurant.menu });
  } catch (error) {
    handleError(res, error, 'Server error deleting menu item');
  }
});

// Route to fetch all restaurants
router.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (err) {
    handleError(res, err, 'Server error fetching restaurants');
  }
});

module.exports = router;
