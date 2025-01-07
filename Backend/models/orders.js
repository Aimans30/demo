const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true },
        size: { type: String, required: true }
    }],
    totalAmount: { type: Number, required: true },
    address: { type: String, required: true },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Declined', 'Out for Delivery', 'Delivered'],
        default: 'Pending'
    },
    createdAt: { type: Date, default: Date.now }
});

// Method to get the restaurant owner's ID
orderSchema.methods.getRestaurantOwnerId = async function () {
    const restaurant = await mongoose.model('Restaurant').findById(this.restaurant).populate('owner');
    if (!restaurant) {
        throw new Error('Restaurant not found');
    }
    return restaurant.owner;
};

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Order;