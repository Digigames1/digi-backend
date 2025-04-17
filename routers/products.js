const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

// 🔐 Дані з .env
const {
  GIFTERY_API_URL,
  GIFTERY_LOGIN,
  GIFTERY_PASSWORD,
  GIFTERY_SECRET
} = process.env;

// ✅ Функція для отримання токена
async function getToken() {
  const time = Math.floor(Date.now() / 1000).toString();

  const payload = time + GIFTERY_LOGIN + GIFTERY_PASSWORD;
  const secretBuffer = Buffer.from(GIFTERY_SECRET, "base64");

  const signature = crypto
    .createHmac("sha256", secretBuffer)
    .update(payload)
    .digest("base64");

  const response = await axios.post(`${GIFTERY_API_URL}/auth`, {
    login: GIFTERY_LOGIN,
    password: GIFTERY_PASSWORD
  }, {
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json",
      "time": time,
      "signature": signature
    }
  });

  return response.data.token;
}

// 🔽 Роут на отримання продуктів
router.get("/", async (req, res) => {
  try {
    const token = await getToken();

    const response = await axios.get(`${GIFTERY_API_URL}/products?currency=USD&responseType=short`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "accept": "application/json"
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Auth or fetch error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch products from Giftery"
    });
  }
});

module.exports = router;




