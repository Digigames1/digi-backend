const express = require("express");
const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", async (req, res) => {
  const { productId, email, quantity } = req.body;

  if (!productId || !email || !quantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  if (typeof productId !== "number" || productId <= 0) {
    return res.status(400).json({ error: "Invalid productId. Must be a number > 0." });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity. Must be an integer ≥ 1." });
  }

  const order = {
    productId,
    email,
    quantity,
    createdAt: new Date()
  };

  try {
    const result = await req.db.collection("orders").insertOne(order);
    res.status(201).json({ message: "Order placed successfully!", orderId: result.insertedId });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

module.exports = router;
