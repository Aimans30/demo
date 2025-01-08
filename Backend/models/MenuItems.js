const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true }, // Reference to the Restaurant model
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;