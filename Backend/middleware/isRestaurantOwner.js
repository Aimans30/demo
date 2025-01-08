const User = require('../models/User');

const isRestaurantOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.userId);

    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('Error in isRestaurantOwner middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = isRestaurantOwner;