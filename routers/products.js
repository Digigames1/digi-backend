const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Дані з .env
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

// 🔄 Пісочниця Giftery
const GIFTERY_URL = "https://stg.giftery.pro/api/v2/marketplace/catalog";

router.get("/", async (req, res) => {
  try {
    const response = await axios.post(GIFTERY_URL, {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
      secret: GIFTERY_SECRET,
      params: {
        category_id: null,
        currency: "USD",
        lang: "en"
      }
    });

    const products = response.data.data || [];
    console.log("✅ Products loaded:", products.length);
    res.json(products);
  } catch (error) {
    console.error("❌ Failed to fetch products from Giftery:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    res.status(500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;
