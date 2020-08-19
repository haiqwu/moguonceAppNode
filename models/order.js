const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;
 
const CartItemSchema = new mongoose.Schema(
    {
        product: { type: ObjectId, ref: "Product" },
        name: String,
        price: Number,
        count: Number
    },
    { timestamps: true }
);

const CartItem = mongoose.model("CartItem", CartItemSchema);

const shippingSchema = {
    full_name: String,
    street_address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    postal_code: { type: String, required: true },
    country_code: { type: String, required: true },
    tracking_number: String,
    shipping_career: String,
    shipping_method: String,
};

const paypalPayerSchema = {
    paypal_payer_id: String,
    email: String,
    last_name: String,
    first_name: String,
    phone: String,
};

const OrderSchema = new mongoose.Schema(
  {
    _id: String,
    products: [CartItemSchema],
    paypal_order_id: String,

    tax_fee: { type: Number },
    shipping_fee: { type: Number },
    required_total_pay: { type: Number },
    actual_total_pay: { type: Number },
    actual_pay_currency_code: String,

    paypal_payer_info: paypalPayerSchema,
    shipping: shippingSchema,
    status: {
        type: String,
        default: "Not processed",
        enum: ["Not processed", "Processing", "Shipped", "Delivered", "Cancelled", "Back Ordered"] // enum means string objects
    },
    updated: Date, // ?
    user: { type: ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order, CartItem };
