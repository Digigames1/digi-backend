import express from "express";
import Order from "../models/Order.mjs";
import { sendCodesEmail } from "../utils/mailer.mjs";
import { purchaseCodes } from "../bamboo/purchase.mjs";

export const ordersRouter = express.Router();

ordersRouter.post("/checkout", async (req, res) => {
  try {
    const { email, currency, lines = [] } = req.body || {};
    if (!email || !currency || !lines.length) throw new Error("Invalid payload");
    const total = lines.reduce(
      (s, l) => s + Number(l.unitPrice || 0) * Number(l.qty || 1),
      0
    );
    const order = await Order.create({ email, currency, lines, total, status: "pending" });
    res.json({ ok: true, orderId: String(order._id) });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

ordersRouter.post("/orders/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) throw new Error("Order not found");

    const buy = await purchaseCodes({
      lines: order.lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        qty: l.qty,
      })),
      currency: order.currency,
      email: order.email,
    });

    order.codes = buy.codes || [];
    order.status = "delivered";
    order.updatedAt = new Date();
    await order.save();

    await sendCodesEmail({ to: order.email, orderId: id, codes: order.codes });

    res.json({ ok: true, order });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});
