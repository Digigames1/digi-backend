import { getMongoose } from "../src/db/mongoose.mjs";

const mongoose = getMongoose();

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

const OrderModel =
  mongoose.models?.Order ||
  (mongoose.connection?.models?.Order) ||
  mongoose.model("Order", OrderSchema);

export const Order = OrderModel;
export default OrderModel;
