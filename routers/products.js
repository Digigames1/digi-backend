const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  GIFTERY_API_URL,
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET
} = process.env;

router.get("/", async (req, res) => {
  try {
    // 1️⃣ Авторизація: отримуємо токен
    const authResponse = await axios.post(`${GIFTERY_API_URL}/auth`, {
      login: GIFTERY_LOGIN,
      password: GIFTERY_PASSWORD,
      secret: GIFTERY_SECRET
    });

    const token = authResponse.data.token;
    if (!token) {
      return res.status(401).json({ error: "Authorization failed, no token returned." });
    }

    // 2️⃣ Отримуємо список товарів
    const productsResponse = await axios.get(`${GIFTERY_API_URL}/products?currency=USD&responseType=short`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    res.json(productsResponse.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;

