const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Дані з .env
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://stg.giftery.pro/api/v1/marketplace/catalog", {
      headers: {
        "Content-Type": "application/json"
      },
      auth: {
        username: GIFTERY_LOGIN,
        password: GIFTERY_PASSWORD
      },
      params: {
        secret: GIFTERY_SECRET,
        currency: "EUR",
        lang: "en"
      }
    });

    const products = response.data?.data || [];
    res.json(products);
  } catch (error) {
    console.error("❌ Failed to fetch products from Giftery:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;

