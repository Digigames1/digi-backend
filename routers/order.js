const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Валідація email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 📩 Налаштування транспорту
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  const { productId, email, quantity } = req.body;

  // Перевірка
  if (!productId || !email || !quantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const order = {
    productId,
    email,
    quantity,
    createdAt: new Date(),
  };

  try {
    const result = await req.db.collection("orders").insertOne(order);
    console.log("✅ Order saved to DB:", result.insertedId);

    // Надсилаємо лист
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎁 Ваш подарунок від DigiGames",
      text: `Дякуємо за замовлення!\n\nВаш товар: ${productId}\nКількість: ${quantity}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully");

    res.status(201).json({ message: "Order placed successfully!", orderId: result.insertedId });
  } catch (err) {
    console.error("Order error:", err);
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
