const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

// 🔐 Дані з .env
const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
  GIFTERY_API_URL
} = process.env;

// Функція для генерації time і signature
function generateSignature(secret) {
  const time = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(time)
    .digest("base64");
  return { time, signature };
}

// Отримати токен
async function getToken() {
  const authUrl = `${GIFTERY_API_URL}/auth`;
  const response = await axios.post(authUrl, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  });
  return response.data.data.token;
}

// Отримати продукти
router.get("/", async (req, res) => {
  try {
    const token = await getToken();
    const { time, signature } = generateSignature(GIFTERY_SECRET);

    const productsUrl = `${GIFTERY_API_URL}/products?currency=USD&responseType=short`;

    const response = await axios.get(productsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
        time: time,
        signature: signature
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;



