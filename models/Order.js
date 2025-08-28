import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true },
    email: String,
    currency: { type: String, default: "USD" },
    items: [
      { id: String, name: String, qty: Number, unitPrice: Number, lineTotal: Number }
    ],
    subtotal: Number,
    discount: Number,
    transaction: Number,
    total: Number,
    provider: { type: String, default: "liqpay" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    meta: Object
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
