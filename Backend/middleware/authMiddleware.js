const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log("Auth Header:", authHeader);
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.replace('Bearer ', '');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      // General error
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }

    console.log("Decoded Token:", decoded);

    User.findById(decoded.userId)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }
        req.user = {
          userId: user._id,
          role: user.role,
          username: user.username
        };
        console.log("req.user set:", req.user);
        next();
      })
      .catch(error => {
        console.error("Database error:", error);
        res.status(500).json({ error: 'Database error', message: error.message });
      });
  });
};

module.exports = authenticateToken;