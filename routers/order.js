const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { productId, email, quantity } = req.body;

  if (!productId || !email || !quantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const order = {
    productId,
    email,
    quantity,
    createdAt: new Date()
  };

  try {
    // Збереження в базу
    const result = await req.db.collection("orders").insertOne(order);

    // Налаштування пошти
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Зміст листа
    const mailOptions = {
      from: `"Digigames" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎁 Ваш подарунок від Digigames",
      text: `Дякуємо за замовлення!\n\nВаш товар (ID: ${productId}) буде оброблено.\n\nКількість: ${quantity}`,
    };

    // Відправка листа
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Order placed successfully!", orderId: result.insertedId });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

module.exports = router;

