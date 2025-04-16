const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const router = express.Router();

// 🔐 Дані з .env
const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
  GIFTERY_API_URL
} = process.env;

// 🧠 Хелпер: генерація токена авторизації
async function getToken() {
  const authUrl = `${GIFTERY_API_URL}/auth`;
  const time = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", GIFTERY_SECRET)
    .update(`${time}`)
    .digest("base64");

  const headers = {
    "Content-Type": "application/json",
    time: time.toString(),
    signature
  };

  const body = {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  };

  const response = await axios.post(authUrl, body, { headers });
  return { token: response.data.data.token, time };
}

// 🛍️ Маршрут: отримаємо каталог товарів
router.get("/", async (req, res) => {
  try {
    const { token, time } = await getToken();

    const method = "GET";
    const endpoint = "/products?currency=USD&responseType=short";

    const signature = crypto.createHmac("sha256", GIFTERY_SECRET)
      .update(`${time}${method}${endpoint}`)
      .digest("base64");

    const headers = {
      accept: "application/json",
      time: time.toString(),
      signature,
      Authorization: `Bearer ${token}`
    };

    const response = await axios.get(`${GIFTERY_API_URL}${endpoint}`, { headers });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;

