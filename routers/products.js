const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Дані з .env
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

// 🔽 Отримати список товарів із Giftery Sandbox
router.get("/", async (req, res) => {
  try {
    const response = await axios.post("https://stg.giftery.pro/api/v1/catalog", {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
      secret: GIFTERY_SECRET,
      params: {
        category_id: null, // опційно
        currency: "USD",   // валюта (UAH, USD, EUR)
        lang: "ru"         // або "en"
      }
    });

    console.log("✅ Products received from Giftery:", response.data);

    const products = response.data?.data || [];
    res.json(products);
  } catch (error) {
    console.error("❌ Failed to fetch products from Giftery:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }

    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;

