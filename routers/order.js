const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  const { productId, email, quantity } = req.body;

  if (!productId || !email || !quantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Перевірка чи є з'єднання з БД
  if (!req.db) {
    console.error("❌ Database connection not available");
    return res.status(500).json({ error: "Database connection failed." });
  }

  const order = {
    productId,
    email,
    quantity,
    createdAt: new Date()
  };

  console.log("⏳ Inserting order to DB:", order);

  try {
    const result = await req.db.collection("orders").insertOne(order);
    console.log("✅ Insert result:", result);
    res.status(201).json({ message: "Order placed successfully!", orderId: result.insertedId });
  } catch (err) {
    console.error("❌ Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

module.exports = router;
