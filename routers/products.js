const express = require("express");
const router = express.Router();
const axios = require("axios");

// 🔐 Дані з .env
const GIFTERY_LOGIN = process.env.GIFTERY_LOGIN;
const GIFTERY_PASSWORD = process.env.GIFTERY_PASSWORD;
const GIFTERY_SECRET = process.env.GIFTERY_SECRET;

const AUTH_URL = "https://stg.giftery.pro/api/v1/authenticate";
const CATALOG_URL = "https://stg.giftery.pro/api/v1/catalog";

// 🚀 GET /api/products
router.get("/", async (req, res) => {
  try {
    // 🔐 Крок 1: Авторизація
    const authResponse = await axios.post(AUTH_URL, {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
      secret: GIFTERY_SECRET,
    });

    const token = authResponse.data?.access_token;

    if (!token) {
      return res.status(500).json({ error: "Authentication failed." });
    }

    // 📦 Крок 2: Запит каталогу з токеном
    const catalogResponse = await axios.get(CATALOG_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        lang: "en",
        currency: "USD", // можна змінити на EUR / RUB
      },
    });

    const products = catalogResponse.data?.data || [];
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
