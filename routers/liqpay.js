import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";

const router = express.Router();

router.post(
  "/webhook",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const { data, signature } = req.body || {};
      const prv = process.env.LIQPAY_PRIVATE_KEY;
      const calc = crypto
        .createHash("sha1")
        .update(prv + data + prv)
        .digest("base64");
      if (calc !== signature) return res.status(403).end("bad signature");
      const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
      const ok = payload?.status === "success" || payload?.paid === 1;
      await Order.findOneAndUpdate(
        { orderId: payload?.order_id },
        { status: ok ? "paid" : "failed", meta: { liqpay: payload } }
      );
      res.sendStatus(200);
    } catch (e) {
      console.error("[liqpay webhook]", e.message);
      res.sendStatus(200);
    }
  }
);

export default router;
