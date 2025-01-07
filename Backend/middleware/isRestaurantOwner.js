const User = require('../models/User'); // Import your User model

const isRestaurantOwner = async (req, res, next) => {
  try {
    // 1. Check if the user is even authenticated (req.user should be set by authenticateToken)
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' }); // 401 Unauthorized
    }

    // 2. Find the user by ID from the decoded token (should be available on req.user.userId)
    const user = await User.findById(req.user.userId);

    // 3. Check if the user exists and has the 'restaurant' role
    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Forbidden' }); // 403 Forbidden
    }

    // 4. (Optional) Attach the user object to the request for use in other route handlers
    req.user = user;

    // 5. Call next() to proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in isRestaurantOwner middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = isRestaurantOwner;