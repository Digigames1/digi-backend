const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

const {
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET,
  GIFTERY_API_URL
} = process.env;

// 🔐 Функція для створення підпису
function generateSignature(time, secret) {
  return crypto
    .createHmac("sha256", Buffer.from(secret, "base64"))
    .update(time)
    .digest("base64");
}

// 🔐 Отримати токен
async function getToken() {
  const time = Math.floor(Date.now() / 1000).toString();
  const signature = generateSignature(time, GIFTERY_SECRET);

  const response = await axios.post(`${GIFTERY_API_URL}/auth`, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  }, {
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      time,
      signature
    }
  });

  return response.data.data.token;
}

// 📦 Отримати список продуктів
router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    const productUrl = `${GIFTERY_API_URL}/products?currency=USD&responseType=short`;

    const response = await axios.get(productUrl, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch products from Giftery" });
  }
});

module.exports = router;





