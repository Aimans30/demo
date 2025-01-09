const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const authenticateToken = require('../middleware/authMiddleware');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orders');

// --- Helper Function ---
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Only admins can perform this action' });
  }
};

// --- User Authentication Routes ---

// POST /api/users/register (Signup)
router.post('/register', async (req, res) => {
  try {
    const { username, mobileNumber, password, role } = req.body;

    if (!username || !mobileNumber || !password) {
      return res.status(400).json({ message: 'Missing required fields: username, mobileNumber and password are required.' });
    }

    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this mobile number already exists.' });
    }

    const newUser = new User({
      username,
      mobileNumber,
      password,
      role: role || 'user',
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('restaurant');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign Role (Admin only)
router.post('/assign-role/:userId', authenticateToken, isAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;
    const { role, restaurantId, newRestaurantData } = req.body;

    if (!userId || !role) {
      throw new Error('User ID and role are required');
    }

    // Restrict allowed roles
    if (!['admin', 'restaurant', 'user'].includes(role)) {
      throw new Error('Invalid role specified');
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Handle the "restaurant" role
    if (role === 'restaurant') {
      let restaurant;

      // If an existing restaurant ID was provided
      if (restaurantId) {
        restaurant = await Restaurant.findById(restaurantId).session(session);
        if (!restaurant) {
          throw new Error('Restaurant not found');
        }
        if (restaurant.owner && restaurant.owner.toString() !== userId) {
          throw new Error('Restaurant already has an owner');
        }
      } 
      // Otherwise, create a new restaurant entry if newRestaurantData is provided
      else if (newRestaurantData) {
        const { name, address } = newRestaurantData;
        if (!name) {
          return res.status(400).json({ message: 'Restaurant name is required' });
        }
        restaurant = new Restaurant({
          ...newRestaurantData,
          owner: user._id,
          isActive: true
        });
        await restaurant.save({ session });
      } 
      // If neither an ID nor new data is provided, throw an error
      else {
        throw new Error('Restaurant ID or new restaurant data is required for restaurant role');
      }

      // If the user was previously linked to a different restaurant, disassociate it
      if (user.restaurant) {
        const prevRestaurant = await Restaurant.findById(user.restaurant).session(session);
        if (prevRestaurant) {
          prevRestaurant.owner = null;
          await prevRestaurant.save({ session });
        }
      }

      // Assign ownership of the found or newly created restaurant
      restaurant.owner = user._id;
      await restaurant.save({ session });
      user.restaurant = restaurant._id;
    } else {
      // If changing away from "restaurant" role, clear old ownership
      if (user.role === 'restaurant' && user.restaurant) {
        const oldRestaurant = await Restaurant.findById(user.restaurant).session(session);
        if (oldRestaurant) {
          oldRestaurant.owner = null;
          await oldRestaurant.save({ session });
        }
        user.restaurant = null;
      }
    }

    // Update user's role
    user.role = role;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate restaurant details for response
    const updatedUser = await User.findById(userId).populate('restaurant');

    return res.json({
      message: 'Role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error("Assign role error:", error);
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({
      message: error.message || 'Error updating user role'
    });
  }
});

// Get All Users (Admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).populate('restaurant');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User by ID (Admin only)
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('restaurant');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('restaurant');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete User (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Find user and check if they have a restaurant
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is a restaurant owner, handle restaurant association
    if (user.role === 'restaurant' && user.restaurant) {
      const restaurant = await Restaurant.findById(user.restaurant);
      if (restaurant) {
        restaurant.owner = null;
        await restaurant.save();
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for admin dashboard
router.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .populate('restaurant')
      .select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/profile/address - Update user's address
router.patch('/profile/address', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from the token
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
});

module.exports = router;
