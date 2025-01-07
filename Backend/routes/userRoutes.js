const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
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
            role: role || 'user'
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

// POST /api/users/logout
router.post('/logout', (req, res) => {
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

// GET /api/users/user (Get the currently authenticated user's profile)
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/profile (Profile Update)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId; 
        const { fullName, phoneNumber, address, oldPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.fullName = fullName || user.fullName; 
        user.phoneNumber = phoneNumber || user.phoneNumber; 
        user.address = address || user.address; 

        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect old password' });
            }

            if (!/(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
                return res.status(400).json({
                    message: 'New password must contain at least one capital letter and one number.',
                });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

// Admin-Only User Management Routes

router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).populate('restaurant');
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Orders Routes

router.post("/", authenticateToken, async (req, res) => {
    try {
        const { restaurant, items, totalAmount } = req.body;
        const customer = req.user.userId;

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

        const order = new Order({ restaurant, customer, items, totalAmount });
        await order.save();

        res.status(201).json({ message: "Order placed successfully.", order });
    } catch (error) {
        console.error("Error placing order:", error.message);
        res.status(500).json({ message: "Server error.", error: error.message });
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error retrieving orders:", error.message);
        res.status(500).json({ message: "Server error.", error: error.message });
    }
});

router.get("/:orderId", authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        res.status(200).json({ order });
    } catch (error) {
        console.error("Error retrieving order:", error.message);
        res.status(500).json({ message: "Server error.", error: error.message });
    }
});

// Get /api/orders/restaurant - Get orders for a specific restaurant
router.get("/restaurant", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "restaurant") {
            return res.status(403).json({ message: "Forbidden: Only restaurant owners can access this route." });
        }

        const restaurant = await Restaurant.findOne({ owner: req.user.userId });
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found for this user." });
        }

        const orders = await Order.find({ restaurant: restaurant._id })
            .populate("customer", "username phoneNumber address")
            .populate("items.menuItem", "name");

        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching restaurant orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
