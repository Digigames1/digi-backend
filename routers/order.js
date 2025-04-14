const express = require("express");
const router = express.Router();

// Проста регулярка для перевірки email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

router.post("/", async (req, res) => {
  const { productId, email, quantity } = req.body;

  if (!productId || !email || !quantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const order = {
    productId,
    email,
    quantity,
    createdAt: new Date()
  };

  try {
    const result = await req.db.collection("orders").insertOne(order);
    res.status(201).json({
      message: "Order placed successfully!",
      orderId: result.insertedId
    });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

module.exports = router;
