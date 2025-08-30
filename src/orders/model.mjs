import mongoose from "mongoose";

const LineSchema = new mongoose.Schema({
  productId: String,
  name: String,
  qty: Number,
  unitPrice: Number,
  currency: String,
});

const OrderSchema = new mongoose.Schema({
  email: String,
  currency: String,
  lines: [LineSchema],
  total: Number,
  status: { type: String, default: "pending" },
  liqpay: Object,
  codes: [{ code:String, pin:String, brand:String, productId:String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: "orders" });

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
