const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Restaurant = require('../models/restaurantModel');
const User = require('../models/user');

module.exports = {
  signup: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, mobileNumber, password } = req.body;

    try {
      const existingUser = await User.findOne({ mobileNumber });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this mobile number' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, mobileNumber, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  login: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mobileNumber, password } = req.body;

    try {
      const user = await User.findOne({ mobileNumber });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this mobile number' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          mobileNumber: user.mobileNumber,
        },
        message: 'Login successful!',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  logout: (req, res) => {
    res.status(200).json({ message: 'User logged out' });
  },

  assignRole: async (req, res) => {
    const { userId } = req.params;
    const { role, restaurantId, newRestaurantData } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.role = role;

      if (role === 'restaurant') {
        if (restaurantId) {
          const restaurant = await Restaurant.findById(restaurantId);
          if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
          }
          restaurant.owner = user._id;
          await restaurant.save();
          user.restaurant = restaurant._id;
        } else if (newRestaurantData) {
          const restaurant = new Restaurant({
            name: newRestaurantData.name,
            address: newRestaurantData.address,
            owner: user._id,
          });
          await restaurant.save();
          user.restaurant = restaurant._id;
        } else {
          return res.status(400).json({ message: 'Restaurant data is required for restaurant role' });
        }
      }

      await user.save();
      res.status(200).json({ message: 'Role assigned successfully', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().populate('restaurant');
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).populate('restaurant');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  updateUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  assignRestaurant: async (req, res) => {
    const { userId, restaurantId } = req.params;

    try {
      const user = await User.findById(userId);
      const restaurant = await Restaurant.findById(restaurantId);

      if (!user || !restaurant) {
        return res.status(404).json({ message: 'User or Restaurant not found' });
      }

      user.role = 'restaurant';
      restaurant.owner = user._id;
      await user.save();
      await restaurant.save();

      res.status(200).json({ message: 'Restaurant assigned to user successfully', user, restaurant });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  getAllRestaurantsByUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).populate('restaurants');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user.restaurants);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  // Add this function to update the user's address
  updateAddress: async (req, res) => {
    try {
      const { userId } = req.params;
      const { address } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { address },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Address updated successfully', user });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
};
