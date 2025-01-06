const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'INDIA' }
});

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // Make category required
  sizes: {
    type: Map, // Or use type: Object if you prefer
    of: Number
  },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: addressSchema, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menu: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  phoneNumber: { type: String },
  cuisine: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

restaurantSchema.index({ name: 1 });
restaurantSchema.index({ owner: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = { Restaurant, MenuItem };