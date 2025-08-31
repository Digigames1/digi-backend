import { getMongoose } from "../db/mongoose.mjs";

const mongoose = getMongoose();

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

const OrderModel =
  mongoose.models?.Order ||
  (mongoose.connection?.models?.Order) ||
  mongoose.model("Order", OrderSchema);

export const Order = OrderModel;
export default OrderModel;
