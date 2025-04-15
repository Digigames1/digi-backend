const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Дані з .env
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

// Маршрут для отримання товарів
router.get("/", async (req, res) => {
  try {
    const response = await axios.post("https://api.giftery.ru/v2/marketplace/catalog", {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
      secret: GIFTERY_SECRET,
      params: {
        category_id: null, // можна вказати конкретну категорію
        currency: "UAH",   // або USD / EUR
        lang: "uk"
      }
    });

    const products = response.data.data || [];
    res.json(products);
  } catch (error) {
    console.error("❌ Failed to fetch products:", error.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;

