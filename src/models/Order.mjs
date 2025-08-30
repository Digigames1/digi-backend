import mongoose from "mongoose";

const LineSchema = new mongoose.Schema({
  productId: String,
  name: String,
  qty: Number,
  unitPrice: Number,
  currency: String,
});

const CodeSchema = new mongoose.Schema({
  code: String,
  brand: String,
  productId: String,
  pin: String,
});

const OrderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    currency: { type: String, required: true },
    lines: [LineSchema],
    total: Number,
    status: { type: String, default: "pending" }, // pending|paid|delivered|failed
    liqpay: Object,
    codes: [CodeSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "orders" }
);

const existingModel =
  (mongoose.connection && mongoose.connection.models && mongoose.connection.models.Order) ||
  (mongoose.models && mongoose.models.Order) ||
  null;

export const Order = existingModel || mongoose.model("Order", OrderSchema);
export default Order;
