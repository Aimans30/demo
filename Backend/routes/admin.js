const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import User model
const { Restaurant } = require('../models/restaurantModel'); // Import Restaurant model

// POST /admin/api/users/assign-role/:userId
// Update user role and associate with a restaurant (if applicable)
router.post('/api/users/assign-role/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role, restaurantId, newRestaurantData } = req.body;

    // --- Input Validation (Important! Add more as needed) ---
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    if (role === 'restaurant') {
      if (!restaurantId && !newRestaurantData) {
        return res.status(400).json({ message: 'Either restaurantId or newRestaurantData is required for restaurant role' });
      }

      if (newRestaurantData) {
        if (!newRestaurantData.name || !newRestaurantData.address || !newRestaurantData.phoneNumber) {
          return res.status(400).json({ message: 'Restaurant name, address, and phoneNumber are required' });
        }
      }
    }
    // --- End of Input Validation ---

    if (role !== 'restaurant') {
      // Handle other roles (e.g., 'admin', 'user')
      const updatedUser = await User.findByIdAndUpdate(userId, { role: role, restaurant: null }, { new: true });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user: updatedUser });
    }

    // --- Role is 'restaurant' - Handle restaurant association: ---
    let restaurant;
    if (restaurantId) {
      // Use existing restaurant
      restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
    } else if (newRestaurantData) {
      // Create a new restaurant
      newRestaurantData.owner = userId; // Set the owner to the user
      restaurant = new Restaurant(newRestaurantData);
      await restaurant.save();
    }

    // Update user and restaurant (both ways)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: role, restaurant: restaurant._id },
      { new: true }
    );

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      { owner: userId },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: updatedUser, restaurant: updatedRestaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Example route to get all users (protect this with authentication in a real app)
router.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}).populate('restaurant'); // Populate the associated restaurant
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Example route to get all restaurants
router.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({});
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;