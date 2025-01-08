const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("Auth Header:", authHeader); // Log the authorization header for debugging

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from the header

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }

    console.log("Decoded Token:", decoded); // Log the decoded token for debugging

    // Fetch the user from the database to ensure they exist
    User.findById(decoded.userId)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Attach user details to the request object
        req.user = {
          userId: user._id,
          role: user.role,
          username: user.username,
        };

        console.log("req.user set:", req.user); // Log the user details for debugging
        next(); // Proceed to the next middleware or route handler
      })
      .catch(error => {
        console.error("Database error:", error); // Log database errors
        res.status(500).json({ error: 'Database error', message: error.message });
      });
  });
};

module.exports = authenticateToken;