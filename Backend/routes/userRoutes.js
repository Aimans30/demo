const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const { Restaurant } = require('../models/restaurantModel');
const Order = require('../models/orders');

// --- Helper Function (Optional) ---
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
        const { username, mobileNumber, password, role } = req.body; // Only require mobileNumber and password

        // Validate that required fields are present
        if (!username || !mobileNumber || !password) {
            return res.status(400).json({ message: 'Missing required fields: username, mobileNumber and password are required.' });
        }

        // Check for existing user with the same mobile number
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            return res.status(409).json({ message: 'A user with this mobile number already exists.' });
        }

        // Create a new user (consider hashing the password before saving)
        const newUser = new User({
            username,
            mobileNumber,
            password, // Make sure to hash this in a real application
            role: role || 'user' // Set a default role if not provided
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

// POST /api/users/logout (Logout - basic implementation)
router.post('/logout', (req, res) => {
    // On the client-side, remove the token from local storage or wherever it's stored
    res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/users/orders (fetch orders for the logged-in user)
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user.userId })
            .populate("restaurant", "name")
            .populate("items.menuItem", "name sizes");

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Get Current User Profile ---
// GET /api/users/user (Get the currently authenticated user's profile)
router.get('/user', authenticateToken, async (req, res) => {
    try {
        // authenticateToken middleware ensures req.user is set
        const user = await User.findById(req.user.userId);

        // If user was deleted after token was issued, but before this request
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Admin-Only User Management Routes ---

// Assign Role (Admin only)
router.post('/assign-role/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { role, restaurantId, newRestaurantData } = req.body;

        // Input Validation
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        const validRoles = ['admin', 'restaurant', 'user'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Handle restaurant association if role is 'restaurant'
        if (role === 'restaurant') {
            let restaurant;
            if (restaurantId) {
                // Associate with existing restaurant
                restaurant = await Restaurant.findById(restaurantId);
                if (!restaurant) {
                    return res.status(404).json({ message: 'Restaurant not found' });
                }
            } else if (newRestaurantData) {
                // Create a new restaurant
                const { name, address, phoneNumber } = newRestaurantData;

                // Validate required fields for new restaurant
                if (!name || !address || !phoneNumber) {
                    return res.status(400).json({ message: 'Restaurant name, address, and phone number are required' });
                }

                // Validate address object format
                if (!address.street || !address.city || !address.state || !address.postalCode) {
                    return res.status(400).json({ message: 'Invalid address format' });
                }

                const newRestaurant = new Restaurant({
                    name,
                    address: {
                        street: address.street,
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                        country: address.country || 'INDIA',
                    },
                    phoneNumber,
                    owner: userId,
                });

                await newRestaurant.save();
                restaurant = newRestaurant;
            }

            // Update user with restaurant role and ID
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { role: 'restaurant', restaurant: restaurant._id },
                { new: true }
            ).populate('restaurant');

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update restaurant's owner
            await Restaurant.findByIdAndUpdate(
                restaurant._id,
                { owner: userId },
                { new: true }
            );

            return res.status(200).json({ user: updatedUser });
        } else {
            // Handle other roles ('admin', 'user')
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { role, restaurant: null }, // Remove restaurant association for other roles
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({ user: updatedUser });
        }
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            // Handle Mongoose validation errors
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ message: 'Validation error', errors });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
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
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('restaurant');
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete User (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;