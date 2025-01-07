const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// CORS - Restrict origins in production
app.use(cors({
  origin: ['http://localhost:3000'] // Replace with your frontend URLs in production
}));
app.use(express.json());
app.use(helmet());

// --- Connect to MongoDB ---
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit with error if connection fails
  });

// --- Routes ---
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const restaurantRoutes = require('./routes/restaurantRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount routes with appropriate base paths (adjusted order)
app.use('/api/users', userRoutes); // User routes
app.use('/api/restaurants', restaurantRoutes); // Restaurant routes
app.use('/api/orders', orderRoutes); // Order routes
app.use('/admin', adminRoutes); // Admin panel routes

// --- Error Handling ---
// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// --- Start the Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
