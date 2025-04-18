const express = require("express");
const router = express.Router();

// Валідація email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

router.post("/", async (req, res) => {
  const { productId, email, quantity, name, price } = req.body;

  // Перевірка
  if (!productId || !email || !quantity || !name || !price) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const order = {
    productId,
    email,
    name,
    quantity,
    price: parseFloat(price),
    status: "pending",
    createdAt: new Date(),
  };

  try {
    const result = await req.db.collection("orders").insertOne(order);
    console.log("✅ Order saved to DB:", result.insertedId);

    // 🔕 Тимчасово НЕ надсилаємо email
    // Якщо потрібно, розкоментуй нижче і додай nodemailer + env

    res.status(201).json({ message: "Order saved!", orderId: result.insertedId });
  } catch (err) {
    console.error("❌ Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

// GET: Отримати всі замовлення
router.get("/", async (req, res) => {
  try {
    const orders = await req.db.collection("orders").find().toArray();
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// ✅ GET: Адмін-доступ (тільки з токеном)
router.get("/admin", async (req, res) => {
  const token = req.query.token;

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  try {
    const orders = await req.db.collection("orders").find().toArray();
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Admin fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

module.exports = router;

