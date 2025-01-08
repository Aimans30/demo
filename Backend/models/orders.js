const mongoose = require("mongoose");
const MenuItem = require("./MenuItems"); // Import the MenuItem model

const orderSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
      quantity: { type: Number, required: true },
      size: { type: String, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  orderStatus: {
    type: String,
    enum: ["Placed", "Accepted", "Preparing", "Ready", "Delivered", "Cancelled"],
    default: "Placed",
  },
  createdAt: { type: Date, default: Date.now },
});

// Method to get the restaurant owner's ID
orderSchema.methods.getRestaurantOwnerId = async function () {
  const restaurant = await mongoose.model("Restaurant").findById(this.restaurant).populate("owner"); // Populate owner
  if (!restaurant) {
    throw new Error("Restaurant not found"); // Handle case where restaurant is not found
  }
  return restaurant.owner;
};

// Define the model only if it hasn't been defined already
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = Order;