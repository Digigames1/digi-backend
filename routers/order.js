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
    const result = await req.db.collection("orders").insertOne(order);
    console.log("✅ Order saved to DB:", result.insertedId);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"DigiGames" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎁 Ваш подарунок від DigiGames!",
      text: `Дякуємо за замовлення! Ваш товар №${productId}. Кількість: ${quantity}.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Email sending failed:", error);
      } else {
        console.log("📧 Email sent successfully:", info.response);
      }
    });

    res.status(201).json({ message: "Order placed successfully!", orderId: result.insertedId });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Order processing failed." });
  }
});

module.exports = router;

