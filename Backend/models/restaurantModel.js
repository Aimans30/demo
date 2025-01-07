const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    menu: [{ 
        itemName: { type: String, required: true },
        sizes: {
            Small: { type: Number, required: false },
            Medium: { type: Number, required: false },
            Large: { type: Number, required: false }
        }
    }]
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
