const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'restaurant', 'user'],
    default: 'user'
  },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  email: { type: String, unique: true, sparse: true, index: true },
  isActive: { type: Boolean, default: true },
  address: { type: String, default: '' }, // Add address field
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);